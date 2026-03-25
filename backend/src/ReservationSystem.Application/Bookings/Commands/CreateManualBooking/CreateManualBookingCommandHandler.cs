using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Bookings.Commands.CreateBooking;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Enums;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Application.Bookings.Commands.CreateManualBooking;

/// <summary>
/// Allows a ServiceProvider to manually add a booking on behalf of a student
/// (e.g. a student who booked via WhatsApp). The provider's own userId is used
/// as clientId; studentName is stored in ClientNotes.
/// </summary>
public record CreateManualBookingCommand(
    Guid ServiceId,
    DateTimeOffset StartUtc,
    string StudentName,
    string? Notes
) : IRequest<BookingDto>;

public class CreateManualBookingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService)
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

        var endUtc = request.StartUtc.AddMinutes(service.DurationMinutes);

        var hasConflict = await db.Bookings
            .AnyAsync(b =>
                b.ProviderId == provider.Id &&
                b.Status != BookingStatus.Cancelled &&
                b.Status != BookingStatus.NoShow &&
                b.StartUtc < endUtc &&
                b.EndUtc > request.StartUtc,
                cancellationToken);

        if (hasConflict)
            throw new SlotNotAvailableException(request.StartUtc);

        var clientNotes = string.IsNullOrWhiteSpace(request.Notes)
            ? $"Öğrenci: {request.StudentName}"
            : $"Öğrenci: {request.StudentName} — {request.Notes}";

        // Use provider's own userId as clientId for manual bookings
        var booking = Booking.Create(
            tenantId, service.Id, provider.Id, userId,
            request.StartUtc, endUtc, service.Price, service.Currency,
            clientNotes);

        // Auto-confirm manual bookings
        booking.Confirm();

        await db.Bookings.AddAsync(booking, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new BookingDto(
            booking.Id, service.Id, service.Name,
            provider.Id, provider.User.FullName,
            booking.StartUtc, booking.EndUtc,
            booking.Status.ToString(), booking.Price, booking.Currency,
            booking.ClientNotes);
    }
}
