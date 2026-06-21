namespace ReservationSystem.Application.Common.Interfaces;

public record BookingEmailData(
    Guid BookingId,
    string ServiceName,
    string ProviderName,
    string ProviderEmail,
    string ClientName,
    string? ClientEmail,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    string? ZoomLink = null,
    string? ZoomMeetingId = null,
    string? ZoomPassword = null
);

public interface IEmailService
{
    Task SendBookingConfirmationAsync(BookingEmailData data, CancellationToken ct = default);
    Task SendBookingCancellationAsync(BookingEmailData data, CancellationToken ct = default);
    Task SendBookingReminderAsync(BookingEmailData data, CancellationToken ct = default);
    Task SendPaymentLinkAsync(BookingEmailData data, string paymentLinkToken, CancellationToken ct = default);
}
