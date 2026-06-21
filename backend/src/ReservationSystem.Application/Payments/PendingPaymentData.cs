namespace ReservationSystem.Application.Payments;

public record PendingPaymentData(
    Guid UserId,
    Guid TenantId,
    Guid ServiceId,
    Guid ProviderId,
    DateTimeOffset StartUtc,
    string? ClientNotes,
    Guid? ExistingBookingId = null,
    bool IsPaymentLink = false,
    string? PaymentLinkToken = null,
    string? StudentEmail = null
);
