using MediatR;

namespace ReservationSystem.Application.Bookings.Commands.CancelBooking;

public record CancelBookingCommand(Guid BookingId, string? Reason) : IRequest;
