using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationSystem.Infrastructure.Persistence;

namespace ReservationSystem.Infrastructure.Tenancy;

public class TenantResolutionMiddleware(RequestDelegate next, ILogger<TenantResolutionMiddleware> logger)
{
    // Paths that don't require a tenant context
    private static readonly string[] TenantExemptPaths =
    [
        "/health", "/api/v1/super-admin", "/swagger", "/favicon.ico", "/api/v1/tenants",
        "/api/v1/payments/callback",
        "/api/v1/payments/kuveytturk/callback",
        "/api/v1/payments/kuveytturk/fail",
        "/api/v1/payments/paytr/notify",
        "/api/v1/payments/paytr/complete",
        "/api/v1/pay",
        "/uploads",
        "/robots.txt",
        "/sitemap.xml",
        "/providers",
    ];

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext db, TenantService tenantService)
    {
        if (IsExempt(context.Request.Path))
        {
            await next(context);
            return;
        }

        var slug = ResolveSlug(context);

        if (string.IsNullOrWhiteSpace(slug))
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            await context.Response.WriteAsJsonAsync(new { error = "Tenant context is required." });
            return;
        }

        var tenant = await db.Tenants
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Slug == slug && t.IsActive, context.RequestAborted);

        if (tenant == null)
        {
            logger.LogWarning("Tenant not found for slug '{Slug}'", slug);
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            await context.Response.WriteAsJsonAsync(new { error = $"Tenant '{slug}' not found." });
            return;
        }

        tenantService.SetCurrentTenant(tenant.Id, tenant.Slug);
        context.Items["TenantId"] = tenant.Id;

        logger.LogDebug("Tenant resolved: {Slug} ({TenantId})", slug, tenant.Id);
        await next(context);
    }

    private static string? ResolveSlug(HttpContext context)
    {
        // 1. From subdomain: math-masters.api.example.com
        var host = context.Request.Host.Host;
        var parts = host.Split('.');
        if (parts.Length >= 3)
        {
            var subdomain = parts[0];
            if (subdomain != "www" && subdomain != "api" && subdomain != "admin")
                return subdomain;
        }

        // 2. From header: X-Tenant-Slug: math-masters
        if (context.Request.Headers.TryGetValue("X-Tenant-Slug", out var headerSlug))
            return headerSlug.ToString();

        // 3. From query param (WebSocket/SSE can't send custom headers)
        if (context.Request.Query.TryGetValue("tenant", out var querySlug))
            return querySlug.ToString();

        return null;
    }

    private static bool IsExempt(PathString path)
        => path.Value == "/" || TenantExemptPaths.Any(p => path.StartsWithSegments(p));
}
