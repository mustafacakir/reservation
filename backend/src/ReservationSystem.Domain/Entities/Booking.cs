using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Enums;
using ReservationSystem.Domain.Events;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Domain.Entities;

public class Booking : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public Guid ServiceId { get; private set; }
    public Guid ProviderId { get; private set; }
    public Guid ClientId { get; private set; }
    public DateTimeOffset StartUtc { get; private set; }
    public DateTimeOffset EndUtc { get; private set; }
    public BookingStatus Status { get; private set; } = BookingStatus.Pending;
    public Guid? CancelledByUserId { get; private set; }
    public string? CancellationReason { get; private set; }
    public string? ClientNotes { get; private set; }
    public string? ProviderNotes { get; private set; }
    public decimal Price { get; private set; }
    public string Currency { get; private set; } = "USD";

    // Navigation
    public Service Service { get; private set; } = default!;
    public ServiceProvider Provider { get; private set; } = default!;
    public User Client { get; private set; } = default!;
    public Tenant Tenant { get; private set; } = default!;
    public Review? Review { get; private set; }

    private Booking() { }

    public static Booking Create(Guid tenantId, Guid serviceId, Guid providerId,
        Guid clientId, DateTimeOffset startUtc, DateTimeOffset endUtc,
        decimal price, string currency, string? clientNotes = null)
    {
        if (endUtc <= startUtc)
            throw new ArgumentException("EndUtc must be after StartUtc.");
        if (startUtc < DateTimeOffset.UtcNow)
            throw new BookingException("Cannot book a slot in the past.");

        var booking = new Booking
        {
            TenantId = tenantId,
            ServiceId = serviceId,
            ProviderId = providerId,
            ClientId = clientId,
            StartUtc = startUtc,
            EndUtc = endUtc,
            Price = price,
            Currency = currency,
            ClientNotes = clientNotes
        };

        booking.AddDomainEvent(new BookingCreatedEvent(booking.Id, tenantId, providerId, clientId, startUtc));
        return booking;
    }

    public void Confirm()
    {
        if (Status != BookingStatus.Pending)
            throw new BookingException($"Cannot confirm a booking with status '{Status}'.");

        Status = BookingStatus.Confirmed;
        SetUpdatedAt();
        AddDomainEvent(new BookingConfirmedEvent(Id, TenantId, ProviderId, ClientId));
    }

    public void Cancel(Guid cancelledByUserId, string? reason, int cancellationWindowHours)
    {
        if (Status is BookingStatus.Cancelled or BookingStatus.Completed or BookingStatus.NoShow)
            throw new BookingException($"Cannot cancel a booking with status '{Status}'.");

        if (cancelledByUserId == ClientId &&
            StartUtc < DateTimeOffset.UtcNow.AddHours(cancellationWindowHours))
        {
            throw new BookingException(
                $"Cancellation must be made at least {cancellationWindowHours} hours in advance.");
        }

        Status = BookingStatus.Cancelled;
        CancelledByUserId = cancelledByUserId;
        CancellationReason = reason;
        SetUpdatedAt();
        AddDomainEvent(new BookingCancelledEvent(Id, TenantId, ProviderId, ClientId, reason));
    }

    public void Complete()
    {
        if (Status != BookingStatus.Confirmed)
            throw new BookingException($"Cannot complete a booking with status '{Status}'.");

        Status = BookingStatus.Completed;
        SetUpdatedAt();
    }

    public void MarkNoShow()
    {
        if (Status != BookingStatus.Confirmed)
            throw new BookingException($"Cannot mark no-show for a booking with status '{Status}'.");

        Status = BookingStatus.NoShow;
        SetUpdatedAt();
    }

    public void AddProviderNotes(string notes) { ProviderNotes = notes; SetUpdatedAt(); }
}
