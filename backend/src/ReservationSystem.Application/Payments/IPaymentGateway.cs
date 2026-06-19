namespace ReservationSystem.Application.Payments;

public record GatewayInitRequest(
    string MerchantOrderId,
    Guid UserId,
    string Email,
    string FirstName,
    string LastName,
    Guid ServiceId,
    string ServiceName,
    decimal Price,
    string UserIp,
    string? CardNumber = null,
    string? CardHolderName = null,
    string? CardExpireMonth = null,
    string? CardExpireYear = null,
    string? CardCvv = null
);

public record GatewayInitResult(
    string GatewayType,
    string PendingKey,
    string? FormContent,
    string? IframeToken
);

public interface IPaymentGateway
{
    string Name { get; }
    Task<GatewayInitResult> InitializeAsync(GatewayInitRequest request, CancellationToken ct);
}
