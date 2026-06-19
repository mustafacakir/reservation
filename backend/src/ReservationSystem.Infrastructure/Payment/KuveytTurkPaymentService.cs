using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Xml.Linq;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ReservationSystem.Application.Payments;

namespace ReservationSystem.Infrastructure.Payment;

public class KuveytTurkPaymentService(
    IOptions<KuveytTurkOptions> opts,
    IHttpClientFactory httpClientFactory,
    ILogger<KuveytTurkPaymentService> logger) : IPaymentGateway
{
    public string Name => "KuveytTurk";

    private static readonly string TestEndpointProvision =
        "https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate";
    private static readonly string ProdEndpointProvision =
        "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate";

    public async Task<GatewayInitResult> InitializeAsync(GatewayInitRequest req, CancellationToken ct)
    {
        var o = opts.Value;
        var amountStr = ((int)Math.Round(req.Price * 100)).ToString();
        var endpoint = o.TestMode ? o.TestApiEndpoint : o.ProdApiEndpoint;
        var passwordHash = ComputePasswordHash(o.Password);
        var hashData = ComputeInitHashData(o.MerchantId, req.MerchantOrderId, amountStr, o.OkUrl, o.FailUrl, o.UserName, passwordHash);

        var body = new
        {
            request = new
            {
                cardExpireDateMonth = req.CardExpireMonth,
                amount = amountStr,
                cardCVV2 = req.CardCvv,
                cardHolderName = req.CardHolderName,
                successUrl = o.OkUrl,
                failUrl = o.FailUrl,
                description = req.ServiceName,
                merchantOrderId = req.MerchantOrderId,
                userName = o.UserName,
                cardExpireDateYear = req.CardExpireYear,
                merchantId = o.MerchantId,
                hashData,
                installmentCount = "0",
                deferringCount = "0",
                currency = "0949",
                cardNumber = req.CardNumber,
            }
        };

        logger.LogInformation("KT Init → OrderId={OrderId} Amount={Amount}", req.MerchantOrderId, amountStr);

        var client = httpClientFactory.CreateClient("KuveytTurk");
        var json = JsonSerializer.Serialize(body);
        using var response = await client.PostAsync(
            endpoint,
            new StringContent(json, Encoding.UTF8, "application/json"),
            ct);

        var responseBody = await response.Content.ReadAsStringAsync(ct);
        logger.LogInformation("KT API response: {Response}", responseBody);

        using var doc = JsonDocument.Parse(responseBody);
        var root = doc.RootElement;

        if (!root.GetProperty("success").GetBoolean())
        {
            var msg = root.TryGetProperty("results", out var results) && results.GetArrayLength() > 0
                ? results[0].GetProperty("message").GetString()
                : "KuveytTürk ödeme başlatma hatası.";
            throw new Exception(msg);
        }

        var htmlContent = root.GetProperty("value").GetProperty("htmlContent").GetString()
            ?? throw new Exception("KuveytTürk HTML içerik alınamadı.");

        return new GatewayInitResult("KuveytTurk", req.MerchantOrderId, htmlContent, null);
    }

    public async Task<(bool Success, string? MerchantOrderId, string? Error)> HandleCallbackAsync(
        IFormCollection form, CancellationToken ct)
    {
        var authResponseRaw = form["AuthenticationResponse"].ToString();
        if (string.IsNullOrWhiteSpace(authResponseRaw))
            return (false, null, "Banka yanıtı alınamadı.");

        var authXml = Uri.UnescapeDataString(authResponseRaw);

        XElement root;
        try { root = XElement.Parse(authXml); }
        catch { return (false, null, "Banka yanıtı işlenemedi."); }

        var mdStatus = root.Element("MdStatus")?.Value;
        if (mdStatus != "1")
        {
            var errMsg = root.Element("MdErrorMessage")?.Value ?? "3D Secure doğrulama başarısız.";
            return (false, null, errMsg);
        }

        var md = root.Element("MD")?.Value ?? string.Empty;
        var merchantOrderId = root.Element("MerchantOrderId")?.Value ?? string.Empty;
        var amount = root.Element("Amount")?.Value ?? string.Empty;

        var (ok, error) = await ProvisionAsync(merchantOrderId, amount, md, ct);
        return ok ? (true, merchantOrderId, null) : (false, null, error);
    }

    private async Task<(bool Success, string? Error)> ProvisionAsync(
        string merchantOrderId, string amount, string md, CancellationToken ct)
    {
        var o = opts.Value;
        var passwordHash = ComputePasswordHash(o.Password);
        var hashData = ComputeProvisionHashData(o.MerchantId, o.UserName, merchantOrderId, amount, passwordHash);
        var endpoint = o.TestMode ? TestEndpointProvision : ProdEndpointProvision;

        var xml = $"""
            <KuveytTurkVPosMessage>
              <APIVersion>1.0.0</APIVersion>
              <HashData>{hashData}</HashData>
              <MerchantId>{o.MerchantId}</MerchantId>
              <UserName>{o.UserName}</UserName>
              <CustomerNumber>{o.CustomerNumber}</CustomerNumber>
              <TransactionType>Sale</TransactionType>
              <InstallmentCount>0</InstallmentCount>
              <Amount>{amount}</Amount>
              <MerchantOrderId>{merchantOrderId}</MerchantOrderId>
              <TransactionSecurity>3</TransactionSecurity>
              <KuveytTurkVPosAdditionalData>
                <AdditionalData>
                  <Key>MD</Key>
                  <Data>{md}</Data>
                </AdditionalData>
              </KuveytTurkVPosAdditionalData>
            </KuveytTurkVPosMessage>
            """;

        var client = httpClientFactory.CreateClient("KuveytTurk");
        using var response = await client.PostAsync(
            endpoint,
            new StringContent(xml, Encoding.UTF8, "text/xml"), ct);

        var responseXml = await response.Content.ReadAsStringAsync(ct);

        try
        {
            var doc = XElement.Parse(responseXml);
            var responseCode = doc.Descendants("ResponseCode").FirstOrDefault()?.Value;

            if (responseCode == "00")
                return (true, null);

            var desc = doc.Descendants("ResponseDescription").FirstOrDefault()?.Value
                ?? "Ödeme sağlayıcı hatası.";
            return (false, desc);
        }
        catch
        {
            return (false, "Provizyon yanıtı işlenemedi.");
        }
    }

    private static string ComputePasswordHash(string password)
    {
        var hash = SHA1.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToBase64String(hash);
    }

    private static string ComputeInitHashData(
        string merchantId, string merchantOrderId,
        string amount, string okUrl, string failUrl, string userName, string passwordHash)
    {
        var raw = merchantId + merchantOrderId + amount + okUrl + failUrl + userName + passwordHash;
        return Convert.ToBase64String(SHA1.HashData(Encoding.UTF8.GetBytes(raw)));
    }

    private static string ComputeProvisionHashData(
        string merchantId, string userName, string merchantOrderId,
        string amount, string passwordHash)
    {
        var raw = merchantId + userName + merchantOrderId + amount + passwordHash;
        return Convert.ToBase64String(SHA1.HashData(Encoding.UTF8.GetBytes(raw)));
    }
}
