using System.Net;
using System.Text;
using System.Xml.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Infrastructure.Tenancy;

namespace ReservationSystem.API.Controllers;

/// <summary>
/// Crawler-facing endpoints: robots.txt, sitemap.xml, and server-side meta injection
/// for the homepage and provider profile pages. Single-tenant-per-deployment — resolves
/// the tenant from the "TenantSlug" config value rather than request headers, since
/// crawlers/social-preview bots don't send X-Tenant-Slug.
/// </summary>
[ApiController]
[AllowAnonymous]
public class SeoController(
    IApplicationDbContext db,
    IConfiguration configuration,
    IHttpClientFactory httpClientFactory,
    IMemoryCache cache,
    TenantService tenantService) : ControllerBase
{
    private const string ShellCacheKey = "seo:index-shell";

    [HttpGet("robots.txt")]
    public IActionResult GetRobots()
    {
        var sitemapUrl = $"{Request.Scheme}://{Request.Host}/sitemap.xml";
        var sb = new StringBuilder();
        sb.AppendLine("User-agent: *");
        sb.AppendLine("Allow: /");
        sb.AppendLine("Disallow: /provider");
        sb.AppendLine("Disallow: /client");
        sb.AppendLine("Disallow: /admin");
        sb.AppendLine("Disallow: /login");
        sb.AppendLine("Disallow: /register");
        sb.AppendLine($"Sitemap: {sitemapUrl}");
        return Content(sb.ToString(), "text/plain");
    }

    [HttpGet("sitemap.xml")]
    public async Task<IActionResult> GetSitemap(CancellationToken ct)
    {
        var tenant = await ResolveTenantAsync(ct);
        if (tenant is null) return NotFound();

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";

        var urls = new List<(string Loc, string ChangeFreq)>
        {
            (baseUrl + "/", "daily"),
            (baseUrl + "/providers", "daily"),
        };

        var providerIds = await db.ServiceProviders
            .Where(p => p.TenantId == tenant.Id && p.IsAcceptingClients)
            .Select(p => p.Id)
            .ToListAsync(ct);

        urls.AddRange(providerIds.Select(id => (baseUrl + $"/providers/{id}", "weekly")));

        var urlset = new XElement(ns + "urlset",
            urls.Select(u => new XElement(ns + "url",
                new XElement(ns + "loc", u.Loc),
                new XElement(ns + "changefreq", u.ChangeFreq))));

        var doc = new XDocument(new XDeclaration("1.0", "UTF-8", null), urlset);
        return Content(doc.Declaration + Environment.NewLine + urlset, "application/xml");
    }

    [HttpGet("/")]
    public async Task<IActionResult> GetHome(CancellationToken ct)
    {
        var shell = await LoadShellAsync(ct);
        if (shell is null) return NotFound();

        var tenant = await ResolveTenantAsync(ct);
        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        var title = tenant is not null ? $"{tenant.Name} | Online Ders Rezervasyonu" : "Randevu";
        var description = tenant is not null ? await BuildHomeDescriptionAsync(tenant, ct) : "";

        var html = InjectMeta(shell, title, description, image: null, canonicalUrl: baseUrl + "/", jsonLd: null);
        return Content(html, "text/html; charset=utf-8");
    }

    [HttpGet("providers/{id:guid}")]
    public async Task<IActionResult> GetProviderPage(Guid id, CancellationToken ct)
    {
        var shell = await LoadShellAsync(ct);
        if (shell is null) return NotFound();

        var tenant = await ResolveTenantAsync(ct);
        var provider = tenant is null ? null : await db.ServiceProviders
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id && p.TenantId == tenant.Id, ct);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var canonicalUrl = $"{baseUrl}/providers/{id}";

        if (provider is null)
        {
            var notFoundHtml = InjectMeta(shell, "Öğretmen Bulunamadı", "", null, canonicalUrl, null);
            return new ContentResult { Content = notFoundHtml, ContentType = "text/html; charset=utf-8", StatusCode = 404 };
        }

        var tenantName = tenant!.Name;
        var specializations = string.Join(", ", provider.Specializations);
        var title = $"{provider.User.FullName}{(specializations.Length > 0 ? $" - {specializations}" : "")} | {tenantName}";
        var bioText = StripHtml(provider.Bio);
        var description = bioText.Length > 0
            ? Truncate(bioText, 155)
            : $"{provider.User.FullName} ile ders rezervasyonu yapın.";
        var absoluteImage = ToAbsoluteUrl(baseUrl, provider.User.AvatarUrl);

        string? jsonLd = null;
        if (!string.IsNullOrWhiteSpace(provider.User.FullName))
        {
            var jsonLdObj = new
            {
                context = "https://schema.org",
                type = "Person",
                name = provider.User.FullName,
                description,
                url = canonicalUrl,
                image = absoluteImage,
                aggregateRating = provider.TotalReviews > 0 ? new
                {
                    type = "AggregateRating",
                    ratingValue = provider.AverageRating,
                    reviewCount = provider.TotalReviews,
                } : null,
            };
            jsonLd = System.Text.Json.JsonSerializer.Serialize(jsonLdObj, new System.Text.Json.JsonSerializerOptions
            {
                PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
            }).Replace("\"context\"", "\"@context\"").Replace("\"type\"", "\"@type\"");
        }

        var html = InjectMeta(shell, title, description, absoluteImage, canonicalUrl, jsonLd);
        return Content(html, "text/html; charset=utf-8");
    }

    private async Task<string> BuildHomeDescriptionAsync(Domain.Entities.Tenant tenant, CancellationToken ct)
    {
        var specializationLists = await db.ServiceProviders
            .Where(p => p.TenantId == tenant.Id && p.IsAcceptingClients)
            .Select(p => p.Specializations)
            .ToListAsync(ct);
        var specializations = specializationLists.SelectMany(s => s).Distinct().ToList();

        var serviceNames = await db.Services
            .Where(s => s.TenantId == tenant.Id && s.IsActive)
            .Select(s => s.Name)
            .Distinct()
            .ToListAsync(ct);

        var keywords = specializations.Concat(serviceNames)
            .Select(k => k.Trim())
            .Where(k => k.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (keywords.Count == 0)
            return $"{tenant.Name} bünyesindeki öğretmenlerle ders rezervasyonu yapın.";

        var joined = string.Join(", ", keywords.Take(15));
        return Truncate($"{tenant.Name}: {joined} alanlarında uzman öğretmenlerle online ders rezervasyonu yapın.", 300);
    }

    private static string? ToAbsoluteUrl(string baseUrl, string? path)
    {
        if (string.IsNullOrWhiteSpace(path)) return null;
        return path.StartsWith("http", StringComparison.OrdinalIgnoreCase) ? path : baseUrl + path;
    }

    private async Task<Domain.Entities.Tenant?> ResolveTenantAsync(CancellationToken ct)
    {
        var slug = configuration["TenantSlug"];
        if (string.IsNullOrWhiteSpace(slug)) return null;

        var tenant = await db.Tenants.AsNoTracking().FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive, ct);
        if (tenant is not null)
            tenantService.SetCurrentTenant(tenant.Id, tenant.Slug); // needed for ITenantEntity global query filter
        return tenant;
    }

    private async Task<string?> LoadShellAsync(CancellationToken ct)
    {
        if (cache.TryGetValue(ShellCacheKey, out string? cached)) return cached;

        try
        {
            var client = httpClientFactory.CreateClient("Frontend");
            var html = await client.GetStringAsync("/index.html", ct);
            cache.Set(ShellCacheKey, html, TimeSpan.FromMinutes(5));
            return html;
        }
        catch
        {
            return null;
        }
    }

    private static string InjectMeta(string shell, string title, string description, string? image, string canonicalUrl, string? jsonLd)
    {
        var encodedTitle = WebUtility.HtmlEncode(title);
        var encodedDescription = WebUtility.HtmlEncode(description);

        var html = shell
            .Replace("<title>Randevu</title>", $"<title>{encodedTitle}</title>")
            .Replace("<meta name=\"description\" content=\"\" />", $"<meta name=\"description\" content=\"{encodedDescription}\" />");

        var extraTags = new StringBuilder();
        extraTags.AppendLine($"    <link rel=\"canonical\" href=\"{WebUtility.HtmlEncode(canonicalUrl)}\" />");
        extraTags.AppendLine($"    <meta property=\"og:title\" content=\"{encodedTitle}\" />");
        extraTags.AppendLine($"    <meta property=\"og:description\" content=\"{encodedDescription}\" />");
        extraTags.AppendLine($"    <meta property=\"og:url\" content=\"{WebUtility.HtmlEncode(canonicalUrl)}\" />");
        extraTags.AppendLine("    <meta property=\"og:type\" content=\"profile\" />");
        if (!string.IsNullOrWhiteSpace(image))
        {
            extraTags.AppendLine($"    <meta property=\"og:image\" content=\"{WebUtility.HtmlEncode(image)}\" />");
            extraTags.AppendLine("    <meta name=\"twitter:card\" content=\"summary_large_image\" />");
            extraTags.AppendLine($"    <meta name=\"twitter:image\" content=\"{WebUtility.HtmlEncode(image)}\" />");
        }
        if (!string.IsNullOrWhiteSpace(jsonLd))
        {
            extraTags.AppendLine($"    <script type=\"application/ld+json\">{jsonLd}</script>");
        }

        return html.Replace("</head>", extraTags + "  </head>");
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrWhiteSpace(html)) return "";
        return System.Text.RegularExpressions.Regex.Replace(html, "<[^>]*>", "").Trim();
    }

    private static string Truncate(string s, int maxLength)
        => s.Length <= maxLength ? s : s[..maxLength].TrimEnd() + "…";
}
