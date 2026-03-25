using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Bookings.Commands.CancelBooking;

public class CancelBookingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService)
    : IRequestHandler<CancelBookingCommand>
{
    public async Task Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var role = currentUser.Role ?? throw new UnauthorizedException();

        var booking = await db.Bookings
            .Include(b => b.Service).ThenInclude(s => s.Provider)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Booking), request.BookingId);

        // Authorization: client can only cancel their own; provider can cancel their bookings; admin can cancel all
        var isClient = booking.ClientId == userId && role == UserRole.Client;
        var isProvider = booking.ProviderId == booking.Service.ProviderId &&
                         booking.Service.Provider.UserId == userId;
        var isAdmin = role is UserRole.Admin or UserRole.SuperAdmin;

        if (!isClient && !isProvider && !isAdmin)
            throw new ForbiddenException();

        var tenant = await tenantService.GetCurrentTenantAsync(cancellationToken);
        var cancellationWindowHours = tenant?.Settings.CancellationWindowHours ?? 24;

        booking.Cancel(userId, request.Reason, cancellationWindowHours);
        await db.SaveChangesAsync(cancellationToken);
    }
}
