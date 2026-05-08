using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Admin.Queries.GetAdminStats;

public class GetAdminStatsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminStatsQuery, AdminStatsDto>
{
    public async Task<AdminStatsDto> Handle(GetAdminStatsQuery request, CancellationToken cancellationToken)
    {
        var totalUsers     = await db.Users.CountAsync(u => u.Role == UserRole.Client || u.Role == UserRole.ServiceProvider, cancellationToken);
        var totalProviders = await db.Users.CountAsync(u => u.Role == UserRole.ServiceProvider, cancellationToken);
        var totalClients   = await db.Users.CountAsync(u => u.Role == UserRole.Client, cancellationToken);

        var totalBookings     = await db.Bookings.CountAsync(cancellationToken);
        var pendingBookings   = await db.Bookings.CountAsync(b => b.Status == BookingStatus.Pending, cancellationToken);
        var confirmedBookings = await db.Bookings.CountAsync(b => b.Status == BookingStatus.Confirmed, cancellationToken);
        var completedBookings = await db.Bookings.CountAsync(b => b.Status == BookingStatus.Completed, cancellationToken);
        var cancelledBookings = await db.Bookings.CountAsync(b => b.Status == BookingStatus.Cancelled, cancellationToken);

        var totalRevenue = await db.Bookings
            .Where(b => b.Status == BookingStatus.Completed)
            .SumAsync(b => (decimal?)b.Price, cancellationToken) ?? 0m;

        return new AdminStatsDto(
            totalUsers, totalProviders, totalClients,
            totalBookings, pendingBookings, confirmedBookings,
            completedBookings, cancelledBookings, totalRevenue);
    }
}
