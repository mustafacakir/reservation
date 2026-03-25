using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Domain.Interfaces.Repositories;

public interface IAvailabilityRepository
{
    Task<List<AvailabilitySlot>> GetSlotsByProviderAsync(Guid providerId, CancellationToken ct = default);
    Task<AvailabilityException?> GetExceptionForDateAsync(Guid providerId, DateOnly date, CancellationToken ct = default);
    Task<List<AvailabilityException>> GetExceptionsInRangeAsync(Guid providerId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task ReplaceWeeklyScheduleAsync(Guid providerId, List<AvailabilitySlot> slots, CancellationToken ct = default);
    Task AddExceptionAsync(AvailabilityException exception, CancellationToken ct = default);
    Task RemoveExceptionAsync(Guid exceptionId, CancellationToken ct = default);
}
