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

        // Payment link flow: confirm the existing pending booking
        if (d.ExistingBookingId.HasValue)
        {
            var existing = await db.Bookings
                .Include(b => b.Service).ThenInclude(s => s.Provider).ThenInclude(p => p.User)
                .FirstOrDefaultAsync(b => b.Id == d.ExistingBookingId.Value, cancellationToken)
                ?? throw new NotFoundException("Booking", d.ExistingBookingId.Value);

            existing.Confirm();
            await db.SaveChangesAsync(cancellationToken);

            var studentName = d.ClientNotes ?? "Öğrenci";
            var studentEmail = d.StudentEmail;
            _ = Task.Run(async () =>
            {
                try
                {
                    await emailService.SendBookingConfirmationAsync(new BookingEmailData(
                        existing.Id, existing.Service.Name,
                        existing.Service.Provider.User.FullName, existing.Service.Provider.User.Email,
                        studentName, studentEmail,
                        existing.StartUtc, existing.EndUtc,
                        existing.Service.ZoomLink, existing.Service.ZoomMeetingId, existing.Service.ZoomPassword));
                }
                catch (Exception ex) { logger.LogError(ex, "Payment link confirmation email failed"); }
            }, CancellationToken.None);

            return existing.Id;
        }

        var service = await db.Services
            .IgnoreQueryFilters()
            .Include(s => s.Provider).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == d.ServiceId && s.TenantId == d.TenantId, cancellationToken)
            ?? throw new NotFoundException("Service", d.ServiceId);

        var client = await db.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == d.UserId, cancellationToken)
            ?? throw new NotFoundException("User", d.UserId);

        int weeks = service.RecurrenceWeeks ?? 1;
        var recurrenceGroupId = weeks > 1 ? Guid.NewGuid() : (Guid?)null;

        var bookings = new List<Booking>();
        var blockMinutes = (service.ScheduledStart.HasValue && service.ScheduledEnd.HasValue)
            ? (int)(service.ScheduledEnd.Value - service.ScheduledStart.Value).TotalMinutes
            : service.DurationMinutes;

        for (int w = 0; w < weeks; w++)
        {
            var startUtc = d.StartUtc.AddDays(7 * w);
            var endUtc = startUtc.AddMinutes(blockMinutes);

            var b = Booking.Create(
                d.TenantId, d.ServiceId, d.ProviderId, d.UserId,
                startUtc, endUtc, service.Price, service.Currency, d.ClientNotes,
                recurrenceGroupId);
            b.Confirm();
            bookings.Add(b);
        }

        await db.Bookings.AddRangeAsync(bookings, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var firstBooking = bookings[0];

        _ = Task.Run(async () =>
        {
            try
            {
                await emailService.SendBookingConfirmationAsync(new BookingEmailData(
                    firstBooking.Id, service.Name,
                    service.Provider.User.FullName, service.Provider.User.Email,
                    client.FullName, client.Email,
                    firstBooking.StartUtc, firstBooking.EndUtc,
                    service.ZoomLink, service.ZoomMeetingId, service.ZoomPassword));
            }
            catch (Exception ex) { logger.LogError(ex, "Payment booking confirmation email failed"); }
        }, CancellationToken.None);

        return firstBooking.Id;
    }
}
