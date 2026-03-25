using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Domain.Entities;

public class Review : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid BookingId { get; private set; }
    public Guid ClientId { get; private set; }
    public Guid ProviderId { get; private set; }
    public int Rating { get; private set; }
    public string? Comment { get; private set; }

    // Navigation
    public Booking Booking { get; private set; } = default!;
    public User Client { get; private set; } = default!;
    public ServiceProvider Provider { get; private set; } = default!;

    private Review() { }

    public static Review Create(Guid tenantId, Guid bookingId, Guid clientId,
        Guid providerId, int rating, string? comment)
    {
        if (rating is < 1 or > 5)
            throw new DomainException("Rating must be between 1 and 5.");

        return new Review
        {
            TenantId = tenantId,
            BookingId = bookingId,
            ClientId = clientId,
            ProviderId = providerId,
            Rating = rating,
            Comment = comment?.Trim()
        };
    }
}
