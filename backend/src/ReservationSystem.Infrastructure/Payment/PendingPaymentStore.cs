using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using ReservationSystem.Application.Payments;

namespace ReservationSystem.Infrastructure.Payment;

public class PendingPaymentStore(IDistributedCache cache) : IPendingPaymentStore
{
    private static string Key(string token) => $"pending:payment:{token}";

    public async Task StoreAsync(string token, PendingPaymentData data, TimeSpan ttl, CancellationToken ct = default)
    {
        var json = JsonSerializer.Serialize(data);
        await cache.SetStringAsync(Key(token), json, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        }, ct);
    }

    public async Task<PendingPaymentData?> RetrieveAsync(string token, CancellationToken ct = default)
    {
        var json = await cache.GetStringAsync(Key(token), ct);
        return json is null ? null : JsonSerializer.Deserialize<PendingPaymentData>(json);
    }
}
