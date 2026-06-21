using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Bookings.Commands.CreateBooking;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Enums;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Application.Bookings.Commands.CreateManualBooking;

public record CreateManualBookingCommand(
    Guid ServiceId,
    DateTimeOffset StartUtc,
    string StudentName,
    string? Notes,
    bool GeneratePaymentLink = false,
    string? StudentEmail = null
) : IRequest<BookingDto>;

public class CreateManualBookingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService,
    IEmailService emailService,
    ILogger<CreateManualBookingCommandHandler> logger)
    : IRequestHandler<CreateManualBookingCommand, BookingDto>
{
    public async Task<BookingDto> Handle(
        CreateManualBookingCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId ?? throw new UnauthorizedException();
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        var service = await db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.ProviderId == provider.Id && s.IsActive, cancellationToken)
            ?? throw new NotFoundException("Service", request.ServiceId);

        var effectiveStart = service.ScheduledStart ?? request.StartUtc;
        var endUtc = service.ScheduledEnd ?? effectiveStart.AddMinutes(service.DurationMinutes);

        if (service.SessionType == SessionType.Group)
        {
            var count = await db.Bookings
                .CountAsync(b =>
                    b.ServiceId == service.Id &&
                    b.StartUtc == effectiveStart &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.NoShow,
                    cancellationToken);

            if (count >= service.MaxParticipants)
                throw new ConflictException($"Bu grup dersi doldu. Kontenjan: {service.MaxParticipants} kişi.");
        }
        else
        {
            var hasConflict = await db.Bookings
                .AnyAsync(b =>
                    b.ProviderId == provider.Id &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.NoShow &&
                    b.StartUtc < endUtc &&
                    b.EndUtc > effectiveStart,
                    cancellationToken);

            if (hasConflict)
                throw new SlotNotAvailableException(effectiveStart);
        }

        var clientNotes = string.IsNullOrWhiteSpace(request.Notes)
            ? $"Öğrenci: {request.StudentName}"
            : $"Öğrenci: {request.StudentName} — {request.Notes}";

        var booking = Booking.Create(
            tenantId, service.Id, provider.Id, userId,
            effectiveStart, endUtc, service.Price, service.Currency,
            clientNotes);

        string? paymentLinkToken = null;
        if (request.GeneratePaymentLink && service.Price > 0)
        {
            paymentLinkToken = Guid.NewGuid().ToString("N")[..24];
            booking.SetPaymentLinkToken(paymentLinkToken);
            // stays Pending — student must pay via link
        }
        else
        {
            booking.Confirm();
        }

        await db.Bookings.AddAsync(booking, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        if (request.GeneratePaymentLink && paymentLinkToken is not null && !string.IsNullOrWhiteSpace(request.StudentEmail))
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await emailService.SendPaymentLinkAsync(new BookingEmailData(
                        booking.Id, service.Name,
                        provider.User.FullName, provider.User.Email,
                        request.StudentName, request.StudentEmail,
                        booking.StartUtc, booking.EndUtc), paymentLinkToken);
                }
                catch (Exception ex) { logger.LogError(ex, "Payment link email failed"); }
            }, CancellationToken.None);
        }
        else if (!request.GeneratePaymentLink)
        {
            _ = Task.Run(async () =>
            {
                try
                {
                    await emailService.SendBookingConfirmationAsync(new BookingEmailData(
                        booking.Id, service.Name,
                        provider.User.FullName, provider.User.Email,
                        request.StudentName, request.StudentEmail,
                        booking.StartUtc, booking.EndUtc,
                        service.ZoomLink, service.ZoomMeetingId, service.ZoomPassword));
                }
                catch (Exception ex) { logger.LogError(ex, "Manual booking confirmation email failed"); }
            }, CancellationToken.None);
        }

        return new BookingDto(
            booking.Id, service.Id, service.Name,
            provider.Id, provider.User.FullName,
            booking.StartUtc, booking.EndUtc,
            booking.Status.ToString(), booking.Price, booking.Currency,
            booking.ClientNotes, null, paymentLinkToken);
    }
}
