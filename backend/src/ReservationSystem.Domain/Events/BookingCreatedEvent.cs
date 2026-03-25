using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Events;

public class BookingCreatedEvent(Guid bookingId, Guid tenantId, Guid providerId, Guid clientId, DateTimeOffset startUtc)
    : DomainEvent
{
    public Guid BookingId { get; } = bookingId;
    public Guid TenantId { get; } = tenantId;
    public Guid ProviderId { get; } = providerId;
    public Guid ClientId { get; } = clientId;
    public DateTimeOffset StartUtc { get; } = startUtc;
}
