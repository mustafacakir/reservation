using System.Security.Cryptography;
using System.Text;
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

    private const string TestEndpoint3D =
        "https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelPayGate";
    private const string ProdEndpoint3D =
        "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelPayGate";
    private const string TestEndpointProvision =
        "https://boatest.kuveytturk.com.tr/boa.virtualpos.services/Home/ThreeDModelProvisionGate";
    private const string ProdEndpointProvision =
        "https://sanalpos.kuveytturk.com.tr/ServiceGateWay/Home/ThreeDModelProvisionGate";

    public Task<GatewayInitResult> InitializeAsync(GatewayInitRequest req, CancellationToken ct)
    {
        var o = opts.Value;
        var amountStr = ((int)Math.Round(req.Price * 100)).ToString();
        var endpoint = o.TestMode ? TestEndpoint3D : ProdEndpoint3D;
        var passwordHash = ComputePasswordHash(o.Password);
        var hashData = ComputeInitHashData(o.MerchantId, req.MerchantOrderId, amountStr, o.OkUrl, o.FailUrl, o.UserName, passwordHash);

        logger.LogInformation("KT Init → OrderId={OrderId} Amount={Amount} CardNumber={CardNumber}",
            req.MerchantOrderId, amountStr, string.IsNullOrEmpty(req.CardNumber) ? "BOŞ" : req.CardNumber[..4] + "****");

        var html = $"""
            <!DOCTYPE html>
            <html lang="tr">
            <head><meta charset="UTF-8"><title>Ödeme yönlendiriliyor…</title></head>
            <body>
              <form id="ktForm" method="POST" action="{endpoint}">
                <input type="hidden" name="MerchantId"            value="{o.MerchantId}" />
                <input type="hidden" name="UserName"              value="{o.UserName}" />
                <input type="hidden" name="HashData"              value="{hashData}" />
                <input type="hidden" name="TransactionType"       value="Sale" />
                <input type="hidden" name="TransactionSecurity"   value="3" />
                <input type="hidden" name="InstallmentCount"      value="0" />
                <input type="hidden" name="Amount"                value="{amountStr}" />
                <input type="hidden" name="DisplayAmount"         value="{amountStr}" />
                <input type="hidden" name="CurrencyCode"          value="0949" />
                <input type="hidden" name="MerchantOrderId"       value="{req.MerchantOrderId}" />
                <input type="hidden" name="OkUrl"                 value="{o.OkUrl}" />
                <input type="hidden" name="FailUrl"               value="{o.FailUrl}" />
                <input type="hidden" name="CardNumber"            value="{req.CardNumber}" />
                <input type="hidden" name="CardHolderName"        value="{req.CardHolderName}" />
                <input type="hidden" name="CardExpireDateMonth"   value="{req.CardExpireMonth}" />
                <input type="hidden" name="CardExpireDateYear"    value="{req.CardExpireYear}" />
                <input type="hidden" name="CardCVV2"              value="{req.CardCvv}" />
              </form>
              <script>document.getElementById('ktForm').submit();</script>
            </body>
            </html>
            """;

        return Task.FromResult(new GatewayInitResult("KuveytTurk", req.MerchantOrderId, html, null));
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
