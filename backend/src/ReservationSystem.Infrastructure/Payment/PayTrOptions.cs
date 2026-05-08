namespace ReservationSystem.Infrastructure.Payment;

public class PayTrOptions
{
    public string MerchantId { get; set; } = string.Empty;
    public string MerchantKey { get; set; } = string.Empty;
    public string MerchantSalt { get; set; } = string.Empty;
    public bool TestMode { get; set; } = true;
    public string NotificationUrl { get; set; } = "http://localhost:5000/api/v1/payments/paytr/notify";
    public string ReturnBaseUrl { get; set; } = "http://localhost:5000/api/v1/payments/paytr/complete";
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";
}
