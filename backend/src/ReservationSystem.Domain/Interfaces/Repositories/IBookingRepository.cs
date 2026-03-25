using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Domain.Interfaces.Repositories;

public interface IBookingRepository : IRepository<Booking>
{
    Task<List<Booking>> GetByProviderAndDateRangeAsync(
        Guid providerId, DateTimeOffset from, DateTimeOffset to, CancellationToken ct = default);

    Task<List<Booking>> GetByClientIdAsync(
        Guid clientId, int page, int pageSize, CancellationToken ct = default);

    Task<List<Booking>> GetByProviderIdAsync(
        Guid providerId, int page, int pageSize, CancellationToken ct = default);

    Task<bool> HasConflictAsync(
        Guid providerId, DateTimeOffset startUtc, DateTimeOffset endUtc,
        Guid? excludeBookingId = null, CancellationToken ct = default);
}
