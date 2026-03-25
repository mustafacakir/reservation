using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Events;

public class BookingConfirmedEvent(Guid bookingId, Guid tenantId, Guid providerId, Guid clientId)
    : DomainEvent
{
    public Guid BookingId { get; } = bookingId;
    public Guid TenantId { get; } = tenantId;
    public Guid ProviderId { get; } = providerId;
    public Guid ClientId { get; } = clientId;
}
