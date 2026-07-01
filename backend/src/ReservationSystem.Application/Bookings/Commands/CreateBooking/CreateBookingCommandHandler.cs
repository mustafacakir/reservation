using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Bookings.Common;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Application.Bookings.Commands.CreateBooking;

public class CreateBookingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService,
    IEmailService emailService,
    ISmsService smsService,
    ILogger<CreateBookingCommandHandler> logger)
    : IRequestHandler<CreateBookingCommand, CreateBookingResult>
{
    public async Task<CreateBookingResult> Handle(
        CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId
            ?? throw new UnauthorizedException("Tenant context required.");

        var clientId = currentUser.UserId
            ?? throw new UnauthorizedException("Authentication required.");

        var service = await db.Services
            .Include(s => s.Provider).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Service), request.ServiceId);

        if (service.ProviderId != request.ProviderId)
            throw new ValidationException(["Service does not belong to the specified provider."]);

        if (service.Price > 0)
            throw new ValidationException(["Bu ders ücretsiz değil. Ödeme ile rezervasyon yapınız."]);

        if (!service.Provider.IsAcceptingClients)
            throw new ConflictException("This provider is not currently accepting new clients.");

        var client = await db.Users
            .FirstOrDefaultAsync(u => u.Id == clientId, cancellationToken)
            ?? throw new NotFoundException("User", clientId);

        var members = await ServiceSeriesExpander.ResolveMembersAsync(db, service, cancellationToken);
        var occurrences = ServiceSeriesExpander.Expand(members, request.StartUtc, service.Id);
        var memberIds = members.Select(m => m.Id).ToList();

        var existingActive = await db.Bookings
            .Where(b => b.ClientId == clientId && memberIds.Contains(b.ServiceId) &&
                b.Status != Domain.Enums.BookingStatus.Cancelled &&
                b.Status != Domain.Enums.BookingStatus.NoShow)
            .Select(b => new { b.ServiceId, b.StartUtc })
            .ToListAsync(cancellationToken);
        var existingSet = existingActive.Select(x => (x.ServiceId, x.StartUtc)).ToHashSet();
        if (occurrences.Any(o => existingSet.Contains((o.Member.Id, o.StartUtc))))
            throw new ConflictException("Bu derse zaten kayıtlısınız.");

        foreach (var occurrence in occurrences)
        {
            if (occurrence.Member.SessionType == Domain.Enums.SessionType.Group && occurrence.Member.MaxParticipants.HasValue)
            {
                var count = await db.Bookings.CountAsync(b =>
                    b.ServiceId == occurrence.Member.Id &&
                    b.StartUtc == occurrence.StartUtc &&
                    b.Status != Domain.Enums.BookingStatus.Cancelled &&
                    b.Status != Domain.Enums.BookingStatus.NoShow, cancellationToken);
                if (count >= occurrence.Member.MaxParticipants.Value)
                    throw new ConflictException($"Bu grup dersi doldu. Kontenjan: {occurrence.Member.MaxParticipants} kişi.");
            }
            else if (occurrence.Member.SessionType != Domain.Enums.SessionType.Group)
            {
                var hasConflict = await db.Bookings.AnyAsync(b =>
                    b.ProviderId == request.ProviderId &&
                    b.Status != Domain.Enums.BookingStatus.Cancelled &&
                    b.Status != Domain.Enums.BookingStatus.NoShow &&
                    b.StartUtc < occurrence.EndUtc && b.EndUtc > occurrence.StartUtc, cancellationToken);
                if (hasConflict)
                    throw new SlotNotAvailableException(occurrence.StartUtc);
            }
        }

        var recurrenceGroupId = occurrences.Count > 1 ? Guid.NewGuid() : (Guid?)null;

        var bookings = new List<Booking>();
        foreach (var occurrence in occurrences)
        {
            var b = Booking.Create(tenantId, occurrence.Member.Id, occurrence.Member.ProviderId, clientId,
                occurrence.StartUtc, occurrence.EndUtc, service.Price, service.Currency, request.ClientNotes, recurrenceGroupId);
            b.Confirm();
            bookings.Add(b);
        }

        await db.Bookings.AddRangeAsync(bookings, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var first = bookings[0];

        _ = Task.Run(async () =>
        {
            try
            {
                await emailService.SendBookingConfirmationAsync(new BookingEmailData(
                    first.Id, service.Name,
                    service.Provider.User.FullName, service.Provider.User.Email,
                    client.FullName, client.Email,
                    first.StartUtc, first.EndUtc,
                    service.ZoomLink, service.ZoomMeetingId, service.ZoomPassword));
            }
            catch (Exception ex) { logger.LogError(ex, "Free booking confirmation email failed"); }

            if (!string.IsNullOrWhiteSpace(service.Provider.User.PhoneNumber))
            {
                try
                {
                    var trTz = TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
                    var localStart = TimeZoneInfo.ConvertTime(first.StartUtc, trTz);
                    var dateStr = localStart.ToString("dd.MM.yyyy HH:mm");
                    var smsText = $"Yeni rezervasyon: {client.FullName}, {service.Name}, {dateStr}";
                    await smsService.SendAsync(service.Provider.User.PhoneNumber, smsText);
                }
                catch (Exception ex) { logger.LogError(ex, "Booking SMS notification failed"); }
            }
        }, CancellationToken.None);

        var dto = new BookingDto(
            first.Id, service.Id, service.Name,
            service.ProviderId, service.Provider.User.FullName,
            first.StartUtc, first.EndUtc,
            first.Status.ToString(), first.Price, first.Currency);

        return new CreateBookingResult(first.Id, dto);
    }
}
