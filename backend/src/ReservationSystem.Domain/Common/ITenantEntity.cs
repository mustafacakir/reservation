namespace ReservationSystem.Domain.Common;

public interface ITenantEntity
{
    Guid TenantId { get; }
}
