using ReservationSystem.Domain.Common;

namespace ReservationSystem.Domain.Entities;

public class ServiceProvider : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid UserId { get; private set; }
    public string Bio { get; private set; } = string.Empty;
    public List<string> Specializations { get; private set; } = [];
    public decimal? HourlyRate { get; private set; }
    public string Currency { get; private set; } = "USD";
    public bool IsAcceptingClients { get; private set; } = true;
    public decimal AverageRating { get; private set; }
    public int TotalReviews { get; private set; }

    // Navigation
    public User User { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public ICollection<Service> Services { get; private set; } = [];
    public ICollection<AvailabilitySlot> AvailabilitySlots { get; private set; } = [];
    public ICollection<AvailabilityException> AvailabilityExceptions { get; private set; } = [];
    public ICollection<Booking> Bookings { get; private set; } = [];
    public ICollection<Review> Reviews { get; private set; } = [];

    private ServiceProvider() { }

    public static ServiceProvider Create(Guid tenantId, Guid userId)
    {
        return new ServiceProvider
        {
            TenantId = tenantId,
            UserId = userId
        };
    }

    public void UpdateProfile(string bio, List<string> specializations, decimal? hourlyRate, string currency)
    {
        Bio = bio;
        Specializations = specializations;
        HourlyRate = hourlyRate;
        Currency = currency;
        SetUpdatedAt();
    }

    public void SetAcceptingClients(bool accepting) { IsAcceptingClients = accepting; SetUpdatedAt(); }

    public void UpdateRatingCache(decimal average, int total)
    {
        AverageRating = Math.Round(average, 2);
        TotalReviews = total;
        SetUpdatedAt();
    }
}
