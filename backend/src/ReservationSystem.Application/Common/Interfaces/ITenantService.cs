using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Application.Common.Interfaces;

public interface ITenantService
{
    Guid? CurrentTenantId { get; }
    string? CurrentTenantSlug { get; }
    Task<Tenant?> GetCurrentTenantAsync(CancellationToken ct = default);
    Task<Tenant?> GetBySlugAsync(string slug, CancellationToken ct = default);
}
