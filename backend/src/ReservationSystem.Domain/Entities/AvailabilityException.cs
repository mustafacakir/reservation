using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Domain.Entities;

/// <summary>Overrides for specific dates: day off, or custom hours.</summary>
public class AvailabilityException : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ProviderId { get; private set; }
    public DateOnly Date { get; private set; }
    public AvailabilityExceptionType Type { get; private set; }
    public TimeOnly? CustomStartTime { get; private set; }
    public TimeOnly? CustomEndTime { get; private set; }
    public string? Reason { get; private set; }

    // Navigation
    public ServiceProvider Provider { get; private set; } = default!;

    private AvailabilityException() { }

    public static AvailabilityException CreateDayOff(Guid tenantId, Guid providerId,
        DateOnly date, string? reason = null)
    {
        return new AvailabilityException
        {
            TenantId = tenantId,
            ProviderId = providerId,
            Date = date,
            Type = AvailabilityExceptionType.DayOff,
            Reason = reason
        };
    }

    public static AvailabilityException CreateCustomHours(Guid tenantId, Guid providerId,
        DateOnly date, TimeOnly startTime, TimeOnly endTime, string? reason = null)
    {
        if (endTime <= startTime)
            throw new ArgumentException("EndTime must be after StartTime.");

        return new AvailabilityException
        {
            TenantId = tenantId,
            ProviderId = providerId,
            Date = date,
            Type = AvailabilityExceptionType.CustomHours,
            CustomStartTime = startTime,
            CustomEndTime = endTime,
            Reason = reason
        };
    }
}
