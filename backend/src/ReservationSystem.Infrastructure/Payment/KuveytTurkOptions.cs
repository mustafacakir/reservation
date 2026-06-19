namespace ReservationSystem.Infrastructure.Payment;

public class KuveytTurkOptions
{
    public string MerchantId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string CustomerNumber { get; set; } = string.Empty;
    public bool TestMode { get; set; } = true;
    public string OkUrl { get; set; } = string.Empty;
    public string FailUrl { get; set; } = string.Empty;
    public string FrontendBaseUrl { get; set; } = string.Empty;
    public string TestApiEndpoint { get; set; } = "https://prep-gateway.kuveytturk.com.tr/v1/vpos/threeDPayment";
    public string ProdApiEndpoint { get; set; } = "https://gateway.kuveytturk.com.tr/v1/vpos/threeDPayment";
}