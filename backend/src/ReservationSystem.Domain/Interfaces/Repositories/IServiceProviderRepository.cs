using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Domain.Interfaces.Repositories;

public interface IServiceProviderRepository : IRepository<ServiceProvider>
{
    Task<ServiceProvider?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<ServiceProvider?> GetWithDetailsAsync(Guid id, CancellationToken ct = default);
    Task<(List<ServiceProvider> Items, int TotalCount)> SearchAsync(
        string? specialization, decimal? maxRate, bool? isAccepting,
        int page, int pageSize, CancellationToken ct = default);
}
