using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Payments.Commands.CreateBookingFromPayment;

public record CreateBookingFromPaymentCommand(PendingPaymentData Data) : IRequest<Guid>;

public class CreateBookingFromPaymentCommandHandler(
    IApplicationDbContext db,
    IEmailService emailService,
    ILogger<CreateBookingFromPaymentCommandHandler> logger)
    : IRequestHandler<CreateBookingFromPaymentCommand, Guid>
{
    public async Task<Guid> Handle(CreateBookingFromPaymentCommand request, CancellationToken cancellationToken)
    {
        var d = request.Data;

        var service = await db.Services
            .IgnoreQueryFilters()
            .Include(s => s.Provider).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == d.ServiceId && s.TenantId == d.TenantId, cancellationToken)
            ?? throw new NotFoundException("Service", d.ServiceId);

        var client = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == d.UserId, cancellationToken)
            ?? throw new NotFoundException("User", d.UserId);

        var endUtc = d.StartUtc.AddMinutes(service.DurationMinutes);

        var booking = Booking.Create(
            d.TenantId, d.ServiceId, d.ProviderId, d.UserId,
            d.StartUtc, endUtc, service.Price, service.Currency, d.ClientNotes);

        booking.Confirm();

        await db.Bookings.AddAsync(booking, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        _ = Task.Run(async () =>
        {
            try
            {
                await emailService.SendBookingConfirmationAsync(new BookingEmailData(
                    booking.Id, service.Name,
                    service.Provider.User.FullName, service.Provider.User.Email,
                    client.FullName, client.Email,
                    booking.StartUtc, booking.EndUtc));
            }
            catch (Exception ex) { logger.LogError(ex, "Payment booking confirmation email failed"); }
        }, CancellationToken.None);

        return booking.Id;
    }
}
