using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Domain.Entities;

public class Service : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ProviderId { get; private set; }
    public string Name { get; private set; } = default!;
    public string Description { get; private set; } = string.Empty;
    public int DurationMinutes { get; private set; }
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = "TRY";
    public bool IsActive { get; private set; } = true;
    public int MaxAdvanceBookingDays { get; private set; } = 60;

    public SessionType SessionType { get; private set; } = SessionType.Individual;

    /// <summary>Only set for Group sessions. Null means Individual (no limit).</summary>
    public int? MaxParticipants { get; private set; }

    /// <summary>Only set for recurring Group sessions. Null means one-time. E.g. 4 = repeats weekly for 4 weeks.</summary>
    public int? RecurrenceWeeks { get; private set; }

    /// <summary>Fixed start datetime for Group sessions. Students join without picking a slot.</summary>
    public DateTimeOffset? ScheduledStart { get; private set; }

    /// <summary>Fixed end datetime for Group sessions. Block = ScheduledEnd - ScheduledStart. DurationMinutes is the lesson portion; remainder is break.</summary>
    public DateTimeOffset? ScheduledEnd { get; private set; }

    public string? ZoomLink { get; private set; }
    public string? ZoomMeetingId { get; private set; }
    public string? ZoomPassword { get; private set; }

    // Navigation
    public ServiceProvider Provider { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public ICollection<Booking> Bookings { get; private set; } = [];

    private Service() { }

    public static Service Create(Guid tenantId, Guid providerId, string name,
        string description, int durationMinutes, decimal price, string currency,
        SessionType sessionType = SessionType.Individual, int? maxParticipants = null,
        int? recurrenceWeeks = null, DateTimeOffset? scheduledStart = null,
        DateTimeOffset? scheduledEnd = null, string? zoomLink = null,
        string? zoomMeetingId = null, string? zoomPassword = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (durationMinutes <= 0) throw new ArgumentOutOfRangeException(nameof(durationMinutes));
        if (price < 0) throw new ArgumentOutOfRangeException(nameof(price));
        if (sessionType == SessionType.Group && (maxParticipants is null or <= 0))
            throw new ArgumentOutOfRangeException(nameof(maxParticipants), "Group sessions require MaxParticipants > 0.");

        return new Service
        {
            TenantId = tenantId,
            ProviderId = providerId,
            Name = name.Trim(),
            Description = description,
            DurationMinutes = durationMinutes,
            Price = price,
            Currency = currency,
            SessionType = sessionType,
            MaxParticipants = sessionType == SessionType.Group ? maxParticipants : null,
            RecurrenceWeeks = sessionType == SessionType.Group ? recurrenceWeeks : null,
            ScheduledStart = scheduledStart,
            ScheduledEnd = scheduledEnd,
            ZoomLink = string.IsNullOrWhiteSpace(zoomLink) ? null : zoomLink.Trim(),
            ZoomMeetingId = string.IsNullOrWhiteSpace(zoomMeetingId) ? null : zoomMeetingId.Trim(),
            ZoomPassword = string.IsNullOrWhiteSpace(zoomPassword) ? null : zoomPassword.Trim(),
        };
    }

    public void Update(string name, string description, int durationMinutes,
        decimal price, string currency, int maxAdvanceBookingDays,
        SessionType sessionType = SessionType.Individual, int? maxParticipants = null,
        int? recurrenceWeeks = null, DateTimeOffset? scheduledStart = null,
        DateTimeOffset? scheduledEnd = null, string? zoomLink = null,
        string? zoomMeetingId = null, string? zoomPassword = null)
    {
        if (sessionType == SessionType.Group && (maxParticipants is null or <= 0))
            throw new ArgumentOutOfRangeException(nameof(maxParticipants), "Group sessions require MaxParticipants > 0.");

        Name = name.Trim();
        Description = description;
        DurationMinutes = durationMinutes;
        Price = price;
        Currency = currency;
        MaxAdvanceBookingDays = maxAdvanceBookingDays;
        SessionType = sessionType;
        MaxParticipants = sessionType == SessionType.Group ? maxParticipants : null;
        RecurrenceWeeks = sessionType == SessionType.Group ? recurrenceWeeks : null;
        ScheduledStart = scheduledStart;
        ScheduledEnd = scheduledEnd;
        ZoomLink = string.IsNullOrWhiteSpace(zoomLink) ? null : zoomLink.Trim();
        ZoomMeetingId = string.IsNullOrWhiteSpace(zoomMeetingId) ? null : zoomMeetingId.Trim();
        ZoomPassword = string.IsNullOrWhiteSpace(zoomPassword) ? null : zoomPassword.Trim();
        SetUpdatedAt();
    }

    public void Deactivate() { IsActive = false; SetUpdatedAt(); }
    public void Activate() { IsActive = true; SetUpdatedAt(); }
}
