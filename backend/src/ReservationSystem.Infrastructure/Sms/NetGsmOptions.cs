namespace ReservationSystem.Infrastructure.Sms;

public class NetGsmOptions
{
    public string UserCode { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string MsgHeader { get; set; } = string.Empty;
    public bool Enabled { get; set; } = true;
}
