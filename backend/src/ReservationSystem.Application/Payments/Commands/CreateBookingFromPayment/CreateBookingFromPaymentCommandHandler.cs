using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Payments.Commands.CreateBookingFromPayment;

public record CreateBookingFromPaymentCommand(PendingPaymentData Data) : IRequest<Guid>;

public class CreateBookingFromPaymentCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateBookingFromPaymentCommand, Guid>
{
    public async Task<Guid> Handle(CreateBookingFromPaymentCommand request, CancellationToken cancellationToken)
    {
        var d = request.Data;

        // Use IgnoreQueryFilters since there's no tenant context in the callback request
        var service = await db.Services
            .IgnoreQueryFilters()
            .Include(s => s.Provider).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(s => s.Id == d.ServiceId && s.TenantId == d.TenantId, cancellationToken)
            ?? throw new NotFoundException("Service", d.ServiceId);

        var endUtc = d.StartUtc.AddMinutes(service.DurationMinutes);

        var booking = Booking.Create(
            d.TenantId, d.ServiceId, d.ProviderId, d.UserId,
            d.StartUtc, endUtc, service.Price, service.Currency, d.ClientNotes);

        booking.Confirm(); // Payment succeeded → confirm immediately

        await db.Bookings.AddAsync(booking, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return booking.Id;
    }
}
