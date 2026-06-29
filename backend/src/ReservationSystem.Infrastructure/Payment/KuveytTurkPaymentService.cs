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

    public async Task<GatewayInitResult> InitializeAsync(GatewayInitRequest req, CancellationToken ct)
    {
        var o = opts.Value;
        var amountStr = ((int)Math.Round(req.Price * 100)).ToString();
        var endpoint = o.TestMode ? TestEndpoint3D : ProdEndpoint3D;
        var passwordHash = ComputePasswordHash(o.Password);
        var hashData = ComputeInitHashData(o.MerchantId, req.MerchantOrderId, amountStr, o.OkUrl, o.FailUrl, o.UserName, passwordHash);

        var clientIp = string.IsNullOrWhiteSpace(req.UserIp) ? "1.1.1.1" : req.UserIp;
        var phone = string.IsNullOrWhiteSpace(req.PhoneNumber)
            ? "5000000000"
            : new string(req.PhoneNumber.Where(char.IsDigit).ToArray()).TrimStart('9', '0').PadLeft(10, '5')[..10];

        var xml = $"""
            <KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
              <APIVersion>TDV2.0.0</APIVersion>
              <OkUrl>{o.OkUrl}</OkUrl>
              <FailUrl>{o.FailUrl}</FailUrl>
              <HashData>{hashData}</HashData>
              <MerchantId>{o.MerchantId}</MerchantId>
              <CustomerId>{o.CustomerNumber}</CustomerId>
              <DeviceData>
                <DeviceChannel>02</DeviceChannel>
                <ClientIP>{clientIp}</ClientIP>
              </DeviceData>
              <CardHolderData>
                <BillAddrCity>İstanbul</BillAddrCity>
                <BillAddrCountry>792</BillAddrCountry>
                <BillAddrLine1>Türkiye</BillAddrLine1>
                <BillAddrPostCode>34000</BillAddrPostCode>
                <BillAddrState>34</BillAddrState>
                <Email>{req.Email}</Email>
                <MobilePhone>
                  <Cc>90</Cc>
                  <Subscriber>{phone}</Subscriber>
                </MobilePhone>
              </CardHolderData>
              <UserName>{o.UserName}</UserName>
              <CardNumber>{req.CardNumber}</CardNumber>
              <CardExpireDateYear>{req.CardExpireYear}</CardExpireDateYear>
              <CardExpireDateMonth>{req.CardExpireMonth}</CardExpireDateMonth>
              <CardCVV2>{req.CardCvv}</CardCVV2>
              <CardHolderName>{req.CardHolderName}</CardHolderName>
              <TransactionType>Sale</TransactionType>
              <InstallmentCount>0</InstallmentCount>
              <Amount>{amountStr}</Amount>
              <DisplayAmount>{amountStr}</DisplayAmount>
              <CurrencyCode>0949</CurrencyCode>
              <MerchantOrderId>{req.MerchantOrderId}</MerchantOrderId>
              <TransactionSecurity>3</TransactionSecurity>
            </KuveytTurkVPosMessage>
            """;

        logger.LogInformation(
            "KT Init → Endpoint={Endpoint} MerchantId={MerchantId} CustomerId={CustomerId} UserName={UserName} " +
            "OrderId={OrderId} Amount={Amount} OkUrl={OkUrl} FailUrl={FailUrl} " +
            "CardNumber={CardNumber} CardHolder={CardHolder} HashData={HashData}",
            endpoint, o.MerchantId, o.CustomerNumber, o.UserName,
            req.MerchantOrderId, amountStr, o.OkUrl, o.FailUrl,
            string.IsNullOrEmpty(req.CardNumber) ? "BOŞ" : req.CardNumber[..4] + "****",
            req.CardHolderName, hashData);

        var client = httpClientFactory.CreateClient("KuveytTurk");
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(30));

        string htmlContent;
        try
        {
            using var response = await client.PostAsync(
                endpoint,
                new StringContent(xml, Encoding.UTF8, "text/xml"), cts.Token);
            htmlContent = await response.Content.ReadAsStringAsync(cts.Token);
            logger.LogInformation("KT Init response: StatusCode={StatusCode} Length={Length}",
                (int)response.StatusCode, htmlContent.Length);
        }
        catch (Exception ex)
        {
            logger.LogError("KT Init HTTP failed: {Error}", ex.Message);
            throw new InvalidOperationException("Ödeme başlatılamadı: " + ex.Message, ex);
        }

        return new GatewayInitResult("KuveytTurk", req.MerchantOrderId, htmlContent, null);
    }

    public async Task<(bool Success, string? MerchantOrderId, string? Error)> HandleCallbackAsync(
        IFormCollection form, CancellationToken ct)
    {
        var authResponseRaw = form["AuthenticationResponse"].ToString();
        logger.LogInformation("KT Callback raw AuthenticationResponse: {Raw}", authResponseRaw);

        if (string.IsNullOrWhiteSpace(authResponseRaw))
            return (false, null, "Banka yanıtı alınamadı.");

        // Try URL-decoded first, then raw (bank may send either way)
        var decoded = Uri.UnescapeDataString(authResponseRaw.Replace("+", "%20"));
        logger.LogInformation("KT Callback decoded: {Decoded}", decoded);

        XElement root;
        try
        {
            root = XElement.Parse(decoded);
        }
        catch
        {
            try { root = XElement.Parse(authResponseRaw); }
            catch (Exception ex)
            {
                logger.LogError("KT Callback XML parse failed. Raw={Raw} Error={Error}", authResponseRaw, ex.Message);
                return (false, null, "Banka yanıtı işlenemedi.");
            }
        }

        // Eski format: <MdStatus>1</MdStatus>
        // Yeni format: <MDStatus><MDStatusCode>1</MDStatusCode></MDStatus>
        var mdStatusOld = root.Element("MdStatus")?.Value;
        var mdStatusNew = root.Element("MDStatus")?.Element("MDStatusCode")?.Value;
        var responseCode = root.Element("ResponseCode")?.Value;

        var isSuccess = mdStatusOld == "1"
            || mdStatusNew == "1"
            || responseCode == "00";

        if (!isSuccess)
        {
            var errMsg = root.Element("MdErrorMessage")?.Value
                ?? root.Element("MDStatus")?.Element("MDStatusDescription")?.Value
                ?? root.Element("ResponseMessage")?.Value
                ?? "3D Secure doğrulama başarısız.";
            logger.LogWarning("KT Callback 3DS failed: MdStatus={Old} MDStatusCode={New} ResponseCode={RC} Msg={Msg}",
                mdStatusOld, mdStatusNew, responseCode, errMsg);
            return (false, null, errMsg);
        }

        var md = root.Element("MD")?.Value ?? string.Empty;
        var merchantOrderId = root.Element("MerchantOrderId")?.Value ?? string.Empty;
        // Amount root'ta yoksa VPosMessage içine bak
        var amount = root.Element("Amount")?.Value
            ?? root.Element("VPosMessage")?.Element("Amount")?.Value
            ?? string.Empty;

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
            <KuveytTurkVPosMessage xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
              <APIVersion>TDV2.0.0</APIVersion>
              <HashData>{hashData}</HashData>
              <MerchantId>{o.MerchantId}</MerchantId>
              <CustomerId>{o.CustomerNumber}</CustomerId>
              <UserName>{o.UserName}</UserName>
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

        logger.LogInformation("KT Provision → Endpoint={Endpoint} MerchantId={MerchantId} OrderId={OrderId} Amount={Amount} MD={MD} HashData={HashData}",
            endpoint, o.MerchantId, merchantOrderId, amount, md, hashData);

        var client = httpClientFactory.CreateClient("KuveytTurk");
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(60));

        string responseXml;
        try
        {
            using var response = await client.PostAsync(
                endpoint,
                new StringContent(xml, Encoding.UTF8, "text/xml"), cts.Token);
            responseXml = await response.Content.ReadAsStringAsync(cts.Token);
            logger.LogInformation("KT Provision response: {Response}", responseXml);
        }
        catch (Exception ex)
        {
            logger.LogError("KT Provision HTTP failed: {Error}", ex.Message);
            return (false, "Provizyon isteği zaman aşımına uğradı.");
        }

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
        // Doküman sırası: MerchantId + MerchantOrderId + Amount + UserName + HashPassword
        var raw = merchantId + merchantOrderId + amount + userName + passwordHash;
        return Convert.ToBase64String(SHA1.HashData(Encoding.UTF8.GetBytes(raw)));
    }
}
