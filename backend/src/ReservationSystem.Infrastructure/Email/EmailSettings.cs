namespace ReservationSystem.Infrastructure.Email;

public class EmailSettings
{
    public string SmtpHost { get; set; } = "smtp-relay.brevo.com";
    public int SmtpPort { get; set; } = 587;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "noreply@example.com";
    public string FromName { get; set; } = "Randevu Sistemi";
    public bool Enabled { get; set; } = true;
    public string AppBaseUrl { get; set; } = "https://sevdailematematik.com";
}
