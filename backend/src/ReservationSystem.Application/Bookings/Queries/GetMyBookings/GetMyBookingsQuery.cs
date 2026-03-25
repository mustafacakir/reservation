using MediatR;
using ReservationSystem.Application.Bookings.Commands.CreateBooking;

namespace ReservationSystem.Application.Bookings.Queries.GetMyBookings;

public record GetMyBookingsQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResult<BookingDto>>;

public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}
