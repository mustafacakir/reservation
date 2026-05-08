using MediatR;

namespace ReservationSystem.Application.Payments.Commands.InitializePayment;

public record InitializePaymentCommand(
    Guid ServiceId,
    Guid ProviderId,
    DateTimeOffset StartUtc,
    string? ClientNotes,
    string UserIp = "127.0.0.1"
) : IRequest<InitializePaymentResult>;

public record InitializePaymentResult(
    string GatewayType,
    string? FormContent,
    string? IframeToken,
    string PendingKey
);
