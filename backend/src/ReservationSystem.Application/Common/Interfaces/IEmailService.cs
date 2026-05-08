namespace ReservationSystem.Application.Common.Interfaces;

public record BookingEmailData(
    Guid BookingId,
    string ServiceName,
    string ProviderName,
    string ProviderEmail,
    string ClientName,
    string? ClientEmail,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc
);

public interface IEmailService
{
    Task SendBookingConfirmationAsync(BookingEmailData data, CancellationToken ct = default);
    Task SendBookingCancellationAsync(BookingEmailData data, CancellationToken ct = default);
    Task SendBookingReminderAsync(BookingEmailData data, CancellationToken ct = default);
}
