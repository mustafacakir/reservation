using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Entities;

/// <summary>Weekly recurring availability template for a service provider.</summary>
public class AvailabilitySlot : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ProviderId { get; private set; }
    public DayOfWeek DayOfWeek { get; private set; }
    public TimeOnly StartTime { get; private set; }
    public TimeOnly EndTime { get; private set; }
    public bool IsActive { get; private set; } = true;

    // Navigation
    public ServiceProvider Provider { get; private set; } = default!;

    private AvailabilitySlot() { }

    public static AvailabilitySlot Create(Guid tenantId, Guid providerId,
        DayOfWeek dayOfWeek, TimeOnly startTime, TimeOnly endTime)
    {
        if (endTime <= startTime)
            throw new ArgumentException("EndTime must be after StartTime.");

        return new AvailabilitySlot
        {
            TenantId = tenantId,
            ProviderId = providerId,
            DayOfWeek = dayOfWeek,
            StartTime = startTime,
            EndTime = endTime
        };
    }

    public void Deactivate() { IsActive = false; SetUpdatedAt(); }
}
