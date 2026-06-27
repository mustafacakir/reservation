namespace ReservationSystem.Application.Common.Interfaces;

public interface ISmsService
{
    Task SendAsync(string toPhoneNumber, string message, CancellationToken ct = default);
}
