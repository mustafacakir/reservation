using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Application.Bookings.Commands.CreateBooking;

public class CreateBookingCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService)
    : IRequestHandler<CreateBookingCommand, CreateBookingResult>
{
    public async Task<CreateBookingResult> Handle(
        CreateBookingCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId
            ?? throw new UnauthorizedException("Tenant context required.");

        var clientId = currentUser.UserId
            ?? throw new UnauthorizedException("Authentication required.");

        // Load service with provider
        var service = await db.Services
            .Include(s => s.Provider).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Service), request.ServiceId);

        if (service.ProviderId != request.ProviderId)
            throw new ValidationException(["Service does not belong to the specified provider."]);

        if (!service.Provider.IsAcceptingClients)
            throw new ConflictException("This provider is not currently accepting new clients.");

        var endUtc = request.StartUtc.AddMinutes(service.DurationMinutes);

        // Check for booking conflict (pessimistic: check in DB)
        var hasConflict = await db.Bookings
            .AnyAsync(b =>
                b.ProviderId == request.ProviderId &&
                b.Status != Domain.Enums.BookingStatus.Cancelled &&
                b.Status != Domain.Enums.BookingStatus.NoShow &&
                b.StartUtc < endUtc &&
                b.EndUtc > request.StartUtc,
                cancellationToken);

        if (hasConflict)
            throw new SlotNotAvailableException(request.StartUtc);

        var booking = Booking.Create(
            tenantId, request.ServiceId, request.ProviderId, clientId,
            request.StartUtc, endUtc, service.Price, service.Currency,
            request.ClientNotes);

        // Auto-confirm all new bookings
        booking.Confirm();

        await db.Bookings.AddAsync(booking, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var dto = new BookingDto(
            booking.Id, service.Id, service.Name,
            service.ProviderId, service.Provider.User.FullName,
            booking.StartUtc, booking.EndUtc,
            booking.Status.ToString(), booking.Price, booking.Currency);

        return new CreateBookingResult(booking.Id, dto);
    }
}
