namespace ReservationSystem.Infrastructure.Payment;

public class IyzicoOptions
{
    public string ApiKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://sandbox-api.iyzipay.com";
    public string CallbackUrl { get; set; } = "http://localhost:5000/api/v1/payments/callback";
    public string FrontendBaseUrl { get; set; } = "http://localhost:3000";
}
