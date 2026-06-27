using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Availability.Commands.RemoveDateAvailability;

public class RemoveDateAvailabilityCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<RemoveDateAvailabilityCommand>
{
    public async Task Handle(RemoveDateAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        if (!DateOnly.TryParse(request.Date, out var date))
            throw new ValidationException(["Geçersiz tarih formatı."]);

        var existing = await db.AvailabilityExceptions
            .Where(e => e.ProviderId == provider.Id && e.Date == date)
            .ToListAsync(cancellationToken);

        db.AvailabilityExceptions.RemoveRange(existing);
        await db.SaveChangesAsync(cancellationToken);
    }
}
