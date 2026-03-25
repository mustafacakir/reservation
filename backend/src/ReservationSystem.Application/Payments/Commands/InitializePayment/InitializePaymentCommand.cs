using MediatR;

namespace ReservationSystem.Application.Payments.Commands.InitializePayment;

public record InitializePaymentCommand(
    Guid ServiceId,
    Guid ProviderId,
    DateTimeOffset StartUtc,
    string? ClientNotes
) : IRequest<InitializePaymentResult>;

public record InitializePaymentResult(
    string CheckoutFormContent,
    string Token
);
