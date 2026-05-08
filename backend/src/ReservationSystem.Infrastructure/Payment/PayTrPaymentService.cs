using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;
using ReservationSystem.Application.Payments;

namespace ReservationSystem.Infrastructure.Payment;

public class PayTrPaymentService(
    IOptions<PayTrOptions> opts,
    IHttpClientFactory httpClientFactory) : IPaymentGateway
{
    public string Name => "PayTr";

    public async Task<GatewayInitResult> InitializeAsync(GatewayInitRequest req, CancellationToken ct)
    {
        var o = opts.Value;
        var paymentAmount = (int)Math.Round(req.Price * 100);
        var currency = "TL";
        var testMode = o.TestMode ? "1" : "0";
        var noInstallment = "0";
        var maxInstallment = "0";
        var debugOn = "0";
        var merchantOid = req.MerchantOrderId;

        var basket = JsonSerializer.Serialize(new[]
        {
            new[] { req.ServiceName, req.Price.ToString("F2", CultureInfo.InvariantCulture), "1" }
        });
        var userBasket = Convert.ToBase64String(Encoding.UTF8.GetBytes(basket));

        var hashStr = o.MerchantId + req.UserIp + merchantOid + req.Email
            + paymentAmount + currency + testMode + noInstallment + maxInstallment
            + userBasket + debugOn + o.MerchantSalt;
        var paytrToken = ComputeHmac(hashStr, o.MerchantKey);

        var okUrl = $"{o.ReturnBaseUrl}?oid={Uri.EscapeDataString(merchantOid)}";
        var failUrl = $"{o.FrontendBaseUrl}/client/payment-result?success=false&error={Uri.EscapeDataString("Ödeme başarısız")}";

        var form = new Dictionary<string, string>
        {
            ["merchant_id"]      = o.MerchantId,
            ["user_ip"]          = req.UserIp,
            ["merchant_oid"]     = merchantOid,
            ["email"]            = req.Email,
            ["payment_amount"]   = paymentAmount.ToString(),
            ["paytr_token"]      = paytrToken,
            ["user_basket"]      = userBasket,
            ["debug_on"]         = debugOn,
            ["no_installment"]   = noInstallment,
            ["max_installment"]  = maxInstallment,
            ["user_name"]        = $"{req.FirstName} {req.LastName}",
            ["user_address"]     = "Türkiye",
            ["user_phone"]       = "05000000000",
            ["merchant_ok_url"]  = okUrl,
            ["merchant_fail_url"] = failUrl,
            ["timeout_limit"]    = "30",
            ["currency"]         = currency,
            ["test_mode"]        = testMode,
            ["lang"]             = "tr",
            ["notification_url"] = o.NotificationUrl,
        };

        var client = httpClientFactory.CreateClient("PayTr");
        using var response = await client.PostAsync(
            "https://www.paytr.com/odeme/api/get-token",
            new FormUrlEncodedContent(form), ct);

        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync(ct);
        var result = JsonSerializer.Deserialize<PayTrTokenResponse>(json)
            ?? throw new InvalidOperationException("PayTR returned empty response.");

        if (result.Status != "success")
            throw new InvalidOperationException($"PayTR token hatası: {result.Reason}");

        return new GatewayInitResult("PayTr", merchantOid, null, result.Token);
    }

    public bool VerifyNotification(
        string merchantOid, string status, string totalAmount,
        string receivedHash, out string errorMessage)
    {
        var o = opts.Value;
        var expected = ComputeHmac(merchantOid + o.MerchantSalt + status + totalAmount, o.MerchantKey);
        if (expected == receivedHash)
        {
            errorMessage = string.Empty;
            return true;
        }
        errorMessage = "Hash doğrulaması başarısız.";
        return false;
    }

    private static string ComputeHmac(string data, string key)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
        return Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(data)));
    }

    private record PayTrTokenResponse(
        [property: JsonPropertyName("status")] string Status,
        [property: JsonPropertyName("token")] string? Token,
        [property: JsonPropertyName("reason")] string? Reason
    );
}
