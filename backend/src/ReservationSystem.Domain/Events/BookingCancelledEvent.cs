using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Events;

public class BookingCancelledEvent(Guid bookingId, Guid tenantId, Guid providerId, Guid clientId, string? reason)
    : DomainEvent
{
    public Guid BookingId { get; } = bookingId;
    public Guid TenantId { get; } = tenantId;
    public Guid ProviderId { get; } = providerId;
    public Guid ClientId { get; } = clientId;
    public string? Reason { get; } = reason;
}
