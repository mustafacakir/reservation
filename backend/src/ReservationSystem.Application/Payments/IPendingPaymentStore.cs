namespace ReservationSystem.Application.Payments;

public interface IPendingPaymentStore
{
    Task StoreAsync(string token, PendingPaymentData data, TimeSpan ttl, CancellationToken ct = default);
    Task<PendingPaymentData?> RetrieveAsync(string token, CancellationToken ct = default);
}
