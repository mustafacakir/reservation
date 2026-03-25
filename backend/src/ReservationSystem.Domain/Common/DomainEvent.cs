namespace ReservationSystem.Domain.Common;

public abstract class DomainEvent
{
    public Guid Id { get; } = Guid.NewGuid();
    public DateTimeOffset OccurredAt { get; } = DateTimeOffset.UtcNow;
}