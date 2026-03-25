namespace ReservationSystem.Application.Payments;

public record IyzicoInitializeRequest(
    Guid UserId,
    string UserEmail,
    string UserFirstName,
    string UserLastName,
    Guid ServiceId,
    string ServiceName,
    decimal Price,
    string Currency,
    string IyzicoToken     // returned after init — used as key to store pending
);

public interface IIyzicoPaymentService
{
    /// <summary>
    /// Creates a Checkout Form on iyzico and returns the HTML content to inject + the token.
    /// </summary>
    Task<(string CheckoutFormContent, string Token)> InitializeAsync(
        Guid userId, string email, string firstName, string lastName,
        Guid serviceId, string serviceName, decimal price,
        CancellationToken ct = default);

    /// <summary>
    /// Verifies the payment result for the given token.
    /// Returns success flag and iyzico paymentId if successful.
    /// </summary>
    Task<(bool Success, string? PaymentId, string? ErrorMessage)> VerifyAsync(
        string token, CancellationToken ct = default);
}
