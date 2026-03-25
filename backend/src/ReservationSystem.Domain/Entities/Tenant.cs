using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Domain.Entities;

public class Tenant : BaseEntity
{
    public string Name { get; private set; } = default!;

    /// <summary>URL-friendly identifier, e.g. "math-masters". Used for subdomain resolution.</summary>
    public string Slug { get; private set; } = default!;

    /// <summary>Business sector, e.g. "tutoring", "psychology", "fitness".</summary>
    public string Sector { get; private set; } = default!;

    public PlanTier PlanTier { get; private set; } = PlanTier.Free;
    public bool IsActive { get; private set; } = true;
    public TenantSettings Settings { get; private set; } = new();

    // Navigation
    public ICollection<User> Users { get; private set; } = [];
    public ICollection<Service> Services { get; private set; } = [];
    public ICollection<Booking> Bookings { get; private set; } = [];

    private Tenant() { }

    public static Tenant Create(string name, string slug, string sector, PlanTier planTier = PlanTier.Free)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);
        ArgumentException.ThrowIfNullOrWhiteSpace(sector);

        return new Tenant
        {
            Name = name.Trim(),
            Slug = slug.ToLowerInvariant().Trim(),
            Sector = sector.Trim(),
            PlanTier = planTier
        };
    }

    public void UpdateSettings(TenantSettings settings)
    {
        Settings = settings ?? throw new ArgumentNullException(nameof(settings));
        SetUpdatedAt();
    }

    public void Deactivate() { IsActive = false; SetUpdatedAt(); }
    public void Activate() { IsActive = true; SetUpdatedAt(); }

    public void ChangePlan(PlanTier tier) { PlanTier = tier; SetUpdatedAt(); }
}

/// <summary>Owned type — stored as JSONB column in PostgreSQL.</summary>
public class TenantSettings
{
    public int DefaultSessionDurationMinutes { get; set; } = 60;
    public int CancellationWindowHours { get; set; } = 24;
    public string Currency { get; set; } = "USD";
    public string TimeZone { get; set; } = "UTC";
    public string? LogoUrl { get; set; }
    public string? PrimaryColor { get; set; }
}
