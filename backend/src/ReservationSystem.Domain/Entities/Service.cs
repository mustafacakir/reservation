using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Entities;

public class Service : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ProviderId { get; private set; }
    public string Name { get; private set; } = default!;
    public string Description { get; private set; } = string.Empty;
    public int DurationMinutes { get; private set; }
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = "USD";
    public bool IsActive { get; private set; } = true;
    public int MaxAdvanceBookingDays { get; private set; } = 60;

    // Navigation
    public ServiceProvider Provider { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public ICollection<Booking> Bookings { get; private set; } = [];

    private Service() { }

    public static Service Create(Guid tenantId, Guid providerId, string name,
        string description, int durationMinutes, decimal price, string currency)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (durationMinutes <= 0) throw new ArgumentOutOfRangeException(nameof(durationMinutes));
        if (price < 0) throw new ArgumentOutOfRangeException(nameof(price));

        return new Service
        {
            TenantId = tenantId,
            ProviderId = providerId,
            Name = name.Trim(),
            Description = description,
            DurationMinutes = durationMinutes,
            Price = price,
            Currency = currency
        };
    }

    public void Update(string name, string description, int durationMinutes,
        decimal price, string currency, int maxAdvanceBookingDays)
    {
        Name = name.Trim();
        Description = description;
        DurationMinutes = durationMinutes;
        Price = price;
        Currency = currency;
        MaxAdvanceBookingDays = maxAdvanceBookingDays;
        SetUpdatedAt();
    }

    public void Deactivate() { IsActive = false; SetUpdatedAt(); }
    public void Activate() { IsActive = true; SetUpdatedAt(); }
}
