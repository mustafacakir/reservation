using MediatR;

namespace ReservationSystem.Application.Bookings.Commands.CreateBooking;

public record CreateBookingCommand(
    Guid ServiceId,
    Guid ProviderId,
    DateTimeOffset StartUtc,
    string? ClientNotes
) : IRequest<CreateBookingResult>;

public record CreateBookingResult(Guid BookingId, BookingDto Booking);

public record BookingDto(
    Guid Id,
    Guid ServiceId,
    string ServiceName,
    Guid ProviderId,
    string ProviderName,
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    string Status,
    decimal Price,
    string Currency
);
