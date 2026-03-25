namespace ReservationSystem.Domain.Interfaces.Services;

public interface INotificationService
{
    Task SendBookingConfirmationAsync(Guid bookingId, CancellationToken ct = default);
    Task SendBookingCancellationAsync(Guid bookingId, string? reason, CancellationToken ct = default);
    Task SendBookingReminderAsync(Guid bookingId, CancellationToken ct = default);
}
