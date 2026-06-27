using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ReservationSystem.Application.Common.Interfaces;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace ReservationSystem.Infrastructure.Sms;

public class NetGsmSmsService(
    IHttpClientFactory httpClientFactory,
    IOptions<NetGsmOptions> options,
    ILogger<NetGsmSmsService> logger)
    : ISmsService
{
    private const string ApiUrl = "https://api.netgsm.com.tr/sms/send/json";

    private static readonly HashSet<string> ErrorCodes = ["20", "30", "40", "50", "51", "70", "80", "85"];

    public async Task SendAsync(string toPhoneNumber, string message, CancellationToken ct = default)
    {
        var opts = options.Value;

        if (!opts.Enabled)
        {
            logger.LogInformation("SMS disabled. Would send to {Phone}: {Message}", toPhoneNumber, message);
            return;
        }

        if (string.IsNullOrWhiteSpace(toPhoneNumber))
        {
            logger.LogWarning("SMS skipped: no phone number");
            return;
        }

        var normalizedPhone = NormalizePhone(toPhoneNumber);

        var payload = new
        {
            msgheader = opts.MsgHeader,
            encoding = "TR",
            messages = new[]
            {
                new { no = normalizedPhone, msg = message }
            }
        };

        try
        {
            var client = httpClientFactory.CreateClient("NetGsm");

            var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{opts.UserCode}:{opts.Password}"));
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", credentials);

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(ApiUrl, content, ct);
            var body = (await response.Content.ReadAsStringAsync(ct)).Trim();

            if (ErrorCodes.Contains(body))
                logger.LogWarning("NetGSM SMS failed. Error code: {Code} for {Phone}", body, normalizedPhone);
            else
                logger.LogInformation("SMS sent to {Phone}. JobId: {JobId}", normalizedPhone, body);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "NetGSM SMS exception for {Phone}", normalizedPhone);
        }
    }

    private static string NormalizePhone(string phone)
    {
        // Sadece rakamları al
        var digits = new string(phone.Where(char.IsDigit).ToArray());

        // 05xx → 905xx, 5xx → 905xx
        if (digits.StartsWith("00")) digits = digits[2..];       // 00905xx → 905xx
        if (digits.StartsWith("0"))  digits = "9" + digits;      // 05xx → 95xx
        if (!digits.StartsWith("9")) digits = "90" + digits;     // 5xx → 905xx

        return digits;
    }
}
