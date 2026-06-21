using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using ReservationSystem.Application.Common.Interfaces;
using System.Text;

namespace ReservationSystem.Infrastructure.Email;

public class BrevoEmailService(
    IOptions<EmailSettings> options,
    ILogger<BrevoEmailService> logger)
    : IEmailService
{
    private static readonly TimeZoneInfo TrTz =
        TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");

    private static string FormatLocal(DateTimeOffset utc)
    {
        var local = TimeZoneInfo.ConvertTime(utc, TrTz);
        return local.ToString("dd MMMM yyyy, HH:mm",
            System.Globalization.CultureInfo.CreateSpecificCulture("tr-TR"));
    }

    private static string FormatIcsDt(DateTimeOffset utc) =>
        utc.UtcDateTime.ToString("yyyyMMddTHHmmssZ");

    private static string GenerateIcs(BookingEmailData d, string method = "REQUEST")
    {
        var sb = new StringBuilder();
        sb.AppendLine("BEGIN:VCALENDAR");
        sb.AppendLine("VERSION:2.0");
        sb.AppendLine("PRODID:-//ReservationSystem//TR");
        sb.AppendLine("CALSCALE:GREGORIAN");
        sb.AppendLine($"METHOD:{method}");
        sb.AppendLine("BEGIN:VEVENT");
        sb.AppendLine($"UID:{d.BookingId}@reservation");
        sb.AppendLine($"DTSTART:{FormatIcsDt(d.StartUtc)}");
        sb.AppendLine($"DTEND:{FormatIcsDt(d.EndUtc)}");
        sb.AppendLine($"SUMMARY:{d.ServiceName} – {d.ProviderName}");
        var desc = $"{d.ServiceName} dersi. Eğitmen: {d.ProviderName}";
        if (d.ZoomLink is not null)
            desc += $"\\nZoom: {d.ZoomLink}";
        if (d.ZoomMeetingId is not null)
            desc += $"\\nMeeting ID: {d.ZoomMeetingId}";
        if (d.ZoomPassword is not null)
            desc += $"\\nŞifre: {d.ZoomPassword}";
        sb.AppendLine($"DESCRIPTION:{desc}");
        if (d.ZoomLink is not null)
            sb.AppendLine($"LOCATION:{d.ZoomLink}");
        sb.AppendLine($"ORGANIZER;CN={d.ProviderName}:mailto:{d.ProviderEmail}");
        if (d.ClientEmail is not null)
            sb.AppendLine($"ATTENDEE;CN={d.ClientName};RSVP=TRUE:mailto:{d.ClientEmail}");
        sb.AppendLine("STATUS:CONFIRMED");
        sb.AppendLine("SEQUENCE:0");
        sb.AppendLine("END:VEVENT");
        sb.AppendLine("END:VCALENDAR");
        return sb.ToString();
    }

    private static bool HasSeparateClient(BookingEmailData d) =>
        d.ClientEmail is not null &&
        !string.Equals(d.ClientEmail, d.ProviderEmail, StringComparison.OrdinalIgnoreCase);

    private static string ConfirmHtml(BookingEmailData d, bool toProvider)
    {
        var dateStr = FormatLocal(d.StartUtc);
        if (toProvider)
            return $@"<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto'>
<h2 style='color:#4f46e5'>Yeni Rezervasyon 📅</h2>
<p><strong>{d.ClientName}</strong> adlı kişi <strong>{d.ServiceName}</strong> dersinize rezervasyon yaptı.</p>
<table style='border-collapse:collapse;width:100%'>
  <tr><td style='padding:8px 0;color:#6b7280;width:120px'>Tarih &amp; Saat</td><td style='padding:8px 0;font-weight:600'>{dateStr}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Ders</td><td style='padding:8px 0;font-weight:600'>{d.ServiceName}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Kişi</td><td style='padding:8px 0;font-weight:600'>{d.ClientName}</td></tr>
</table>
<p style='color:#6b7280;font-size:13px;margin-top:24px'>Bu bildirim otomatik gönderilmiştir.</p></div>";
        var zoomSection = (d.ZoomLink is not null || d.ZoomMeetingId is not null)
            ? $@"<div style='margin-top:20px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px'>
  <p style='margin:0 0 8px;font-weight:700;color:#15803d'>🎥 Zoom Bağlantısı</p>
  {(d.ZoomLink is not null ? $"<p style='margin:4px 0'><a href='{d.ZoomLink}' style='color:#4f46e5;font-weight:600'>{d.ZoomLink}</a></p>" : "")}
  {(d.ZoomMeetingId is not null ? $"<p style='margin:4px 0;font-size:13px;color:#374151'>Meeting ID: <strong>{d.ZoomMeetingId}</strong></p>" : "")}
  {(d.ZoomPassword is not null ? $"<p style='margin:4px 0;font-size:13px;color:#374151'>Şifre: <strong>{d.ZoomPassword}</strong></p>" : "")}
</div>"
            : "";
        return $@"<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto'>
<h2 style='color:#4f46e5'>Rezervasyonunuz Onaylandı ✅</h2>
<p>Merhaba <strong>{d.ClientName}</strong>, rezervasyonunuz başarıyla oluşturuldu!</p>
<table style='border-collapse:collapse;width:100%'>
  <tr><td style='padding:8px 0;color:#6b7280;width:120px'>Tarih &amp; Saat</td><td style='padding:8px 0;font-weight:600'>{dateStr}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Ders</td><td style='padding:8px 0;font-weight:600'>{d.ServiceName}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Eğitmen</td><td style='padding:8px 0;font-weight:600'>{d.ProviderName}</td></tr>
</table>
{zoomSection}
<p style='margin-top:16px'>Takvim davetini kabul ederek randevunuzu takviminize ekleyebilirsiniz.</p>
<p style='color:#6b7280;font-size:13px;margin-top:24px'>Bu bildirim otomatik gönderilmiştir.</p></div>";
    }

    private static string CancelHtml(BookingEmailData d, bool toProvider)
    {
        var dateStr = FormatLocal(d.StartUtc);
        var who = toProvider ? d.ClientName : d.ProviderName;
        return $@"<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto'>
<h2 style='color:#dc2626'>Rezervasyon İptal Edildi ❌</h2>
<p><strong>{d.ServiceName}</strong> dersi için {dateStr} tarihli rezervasyon iptal edilmiştir.</p>
<table style='border-collapse:collapse;width:100%'>
  <tr><td style='padding:8px 0;color:#6b7280;width:120px'>Tarih &amp; Saat</td><td style='padding:8px 0;font-weight:600'>{dateStr}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Ders</td><td style='padding:8px 0;font-weight:600'>{d.ServiceName}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>{(toProvider ? "Kişi" : "Eğitmen")}</td><td style='padding:8px 0;font-weight:600'>{who}</td></tr>
</table>
<p style='color:#6b7280;font-size:13px;margin-top:24px'>Bu bildirim otomatik gönderilmiştir.</p></div>";
    }

    private static string ReminderHtml(BookingEmailData d, bool toProvider)
    {
        var dateStr = FormatLocal(d.StartUtc);
        if (toProvider)
            return $@"<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto'>
<h2 style='color:#f59e0b'>Yarın Dersiniz Var! ⏰</h2>
<p>Yarın <strong>{d.ClientName}</strong> ile <strong>{d.ServiceName}</strong> dersiniz var.</p>
<table style='border-collapse:collapse;width:100%'>
  <tr><td style='padding:8px 0;color:#6b7280;width:120px'>Tarih &amp; Saat</td><td style='padding:8px 0;font-weight:600'>{dateStr}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Kişi</td><td style='padding:8px 0;font-weight:600'>{d.ClientName}</td></tr>
</table>
<p style='color:#6b7280;font-size:13px;margin-top:24px'>Bu bildirim otomatik gönderilmiştir.</p></div>";
        return $@"<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto'>
<h2 style='color:#f59e0b'>Yarın Dersiniz Var! ⏰</h2>
<p>Merhaba <strong>{d.ClientName}</strong>, yarın <strong>{d.ServiceName}</strong> dersiniz var!</p>
<table style='border-collapse:collapse;width:100%'>
  <tr><td style='padding:8px 0;color:#6b7280;width:120px'>Tarih &amp; Saat</td><td style='padding:8px 0;font-weight:600'>{dateStr}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Eğitmen</td><td style='padding:8px 0;font-weight:600'>{d.ProviderName}</td></tr>
</table>
<p style='color:#6b7280;font-size:13px;margin-top:24px'>Bu bildirim otomatik gönderilmiştir.</p></div>";
    }

    public async Task SendBookingConfirmationAsync(BookingEmailData d, CancellationToken ct = default)
    {
        var ics = GenerateIcs(d);
        await SendAsync(d.ProviderEmail, d.ProviderName,
            $"Yeni Rezervasyon: {d.ClientName} – {FormatLocal(d.StartUtc)}",
            ConfirmHtml(d, toProvider: true), ics, ct);

        if (HasSeparateClient(d))
            await SendAsync(d.ClientEmail!, d.ClientName,
                $"Rezervasyonunuz Onaylandı: {d.ServiceName}",
                ConfirmHtml(d, toProvider: false), ics, ct);
    }

    public async Task SendBookingCancellationAsync(BookingEmailData d, CancellationToken ct = default)
    {
        var ics = GenerateIcs(d, "CANCEL");
        await SendAsync(d.ProviderEmail, d.ProviderName,
            $"Rezervasyon İptal: {d.ClientName} – {FormatLocal(d.StartUtc)}",
            CancelHtml(d, toProvider: true), ics, ct);

        if (HasSeparateClient(d))
            await SendAsync(d.ClientEmail!, d.ClientName,
                $"Rezervasyon İptal: {d.ServiceName}",
                CancelHtml(d, toProvider: false), ics, ct);
    }

    public async Task SendPaymentLinkAsync(BookingEmailData d, string paymentLinkToken, CancellationToken ct = default)
    {
        if (d.ClientEmail is null) return;
        var baseUrl = options.Value.AppBaseUrl.TrimEnd('/');
        var paymentUrl = $"{baseUrl}/odeme/{paymentLinkToken}";
        var dateStr = FormatLocal(d.StartUtc);
        var html = $@"<div style='font-family:Arial,sans-serif;max-width:560px;margin:0 auto'>
<h2 style='color:#4f46e5'>Ödemenizi Tamamlayın 💳</h2>
<p>Merhaba <strong>{d.ClientName}</strong>,</p>
<p><strong>{d.ServiceName}</strong> dersi için rezervasyonunuz hazırlandı. Aşağıdaki butona tıklayarak ödemenizi güvenle tamamlayabilirsiniz.</p>
<table style='border-collapse:collapse;width:100%;margin:16px 0'>
  <tr><td style='padding:8px 0;color:#6b7280;width:120px'>Tarih &amp; Saat</td><td style='padding:8px 0;font-weight:600'>{dateStr}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Ders</td><td style='padding:8px 0;font-weight:600'>{d.ServiceName}</td></tr>
  <tr><td style='padding:8px 0;color:#6b7280'>Eğitmen</td><td style='padding:8px 0;font-weight:600'>{d.ProviderName}</td></tr>
</table>
<div style='text-align:center;margin:28px 0'>
  <a href='{paymentUrl}' style='display:inline-block;padding:14px 32px;background:#4f46e5;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px'>Ödemeyi Tamamla →</a>
</div>
<p style='color:#6b7280;font-size:13px'>Ödemenizi tamamladığınızda randevunuz otomatik olarak onaylanacak ve onay e-postası gönderilecektir.</p>
<p style='color:#9ca3af;font-size:12px;margin-top:24px'>Bu bildirim otomatik gönderilmiştir. Link 30 dakika geçerlidir.</p></div>";

        await SendAsync(d.ClientEmail, d.ClientName,
            $"Ödeme Linki – {d.ServiceName}",
            html, icsContent: null, ct);
    }

    public async Task SendBookingReminderAsync(BookingEmailData d, CancellationToken ct = default)
    {
        var ics = GenerateIcs(d);
        await SendAsync(d.ProviderEmail, d.ProviderName,
            $"Yarın Dersiniz Var: {d.ClientName}",
            ReminderHtml(d, toProvider: true), ics, ct);

        if (HasSeparateClient(d))
            await SendAsync(d.ClientEmail!, d.ClientName,
                $"Yarın Dersiniz Var: {d.ServiceName}",
                ReminderHtml(d, toProvider: false), ics, ct);
    }

    private async Task SendAsync(string toEmail, string toName, string subject,
        string html, string? icsContent, CancellationToken ct)
    {
        var cfg = options.Value;
        if (!cfg.Enabled || string.IsNullOrEmpty(cfg.SmtpPassword))
        {
            logger.LogInformation("Email skipped (disabled or no SMTP password). To={To} Subject={Subject}", toEmail, subject);
            return;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(cfg.FromName, cfg.FromEmail));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;

            var builder = new BodyBuilder { HtmlBody = html };
            if (icsContent is not null)
            {
                var icsBytes = Encoding.UTF8.GetBytes(icsContent);
                var attachment = builder.Attachments.Add("randevu.ics", icsBytes,
                    new ContentType("text", "calendar"));
                attachment.ContentDisposition = new ContentDisposition(ContentDisposition.Attachment);
            }

            message.Body = builder.ToMessageBody();

            using var smtp = new SmtpClient();
            await smtp.ConnectAsync(cfg.SmtpHost, cfg.SmtpPort, SecureSocketOptions.StartTls, ct);
            await smtp.AuthenticateAsync(cfg.SmtpUsername, cfg.SmtpPassword, ct);
            await smtp.SendAsync(message, ct);
            await smtp.DisconnectAsync(true, ct);

            logger.LogInformation("Email sent to {Email}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
