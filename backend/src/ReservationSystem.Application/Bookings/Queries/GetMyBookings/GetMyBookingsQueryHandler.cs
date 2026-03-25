using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Bookings.Commands.CreateBooking;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Bookings.Queries.GetMyBookings;

public class GetMyBookingsQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetMyBookingsQuery, PagedResult<BookingDto>>
{
    public async Task<PagedResult<BookingDto>> Handle(
        GetMyBookingsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var role = currentUser.Role ?? throw new UnauthorizedException();

        var query = db.Bookings
            .Include(b => b.Service)
            .Include(b => b.Provider).ThenInclude(p => p.User)
            .AsQueryable();

        query = role switch
        {
            UserRole.Client => query.Where(b => b.ClientId == userId),
            UserRole.ServiceProvider => query.Where(b => b.Provider.UserId == userId),
            _ => query // Admin sees all (already tenant-filtered by global filter)
        };

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(b => b.StartUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(b => new BookingDto(
                b.Id, b.ServiceId, b.Service.Name,
                b.ProviderId, b.Provider.User.FullName,
                b.StartUtc, b.EndUtc,
                b.Status.ToString(), b.Price, b.Currency))
            .ToListAsync(cancellationToken);

        return new PagedResult<BookingDto>(items, total, request.Page, request.PageSize);
    }
}
