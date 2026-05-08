using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Bookings.Commands.CancelBooking;

public class CancelBookingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService,
    IEmailService emailService,
    ILogger<CancelBookingCommandHandler> logger)
    : IRequestHandler<CancelBookingCommand>
{
    public async Task Handle(CancelBookingCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var role = currentUser.Role ?? throw new UnauthorizedException();

        var booking = await db.Bookings
            .Include(b => b.Service)
            .Include(b => b.Provider).ThenInclude(p => p.User)
            .Include(b => b.Client)
            .FirstOrDefaultAsync(b => b.Id == request.BookingId, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Booking), request.BookingId);

        var isClient = booking.ClientId == userId && role == UserRole.Client;
        var isProvider = booking.Service.Provider.UserId == userId;
        var isAdmin = role is UserRole.Admin or UserRole.SuperAdmin;

        if (!isClient && !isProvider && !isAdmin)
            throw new ForbiddenException();

        var tenant = await tenantService.GetCurrentTenantAsync(cancellationToken);
        var cancellationWindowHours = tenant?.Settings.CancellationWindowHours ?? 24;

        booking.Cancel(userId, request.Reason, cancellationWindowHours);
        await db.SaveChangesAsync(cancellationToken);

        _ = Task.Run(async () =>
        {
            try
            {
                await emailService.SendBookingCancellationAsync(new BookingEmailData(
                    booking.Id, booking.Service.Name,
                    booking.Provider.User.FullName, booking.Provider.User.Email,
                    booking.Client.FullName, booking.Client.Email,
                    booking.StartUtc, booking.EndUtc));
            }
            catch (Exception ex) { logger.LogError(ex, "Cancellation email failed"); }
        }, CancellationToken.None);
    }
}
