using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Application.Availability.Commands.SetWeeklyAvailability;

public class SetWeeklyAvailabilityCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService)
    : IRequestHandler<SetWeeklyAvailabilityCommand>
{
    public async Task Handle(SetWeeklyAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var tenantId = tenantService.CurrentTenantId ?? throw new UnauthorizedException("Tenant context is required.");

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        // Remove all existing slots for this provider
        var existing = await db.AvailabilitySlots
            .Where(s => s.ProviderId == provider.Id)
            .ToListAsync(cancellationToken);

        db.AvailabilitySlots.RemoveRange(existing);

        // Add new slots
        foreach (var slot in request.Slots)
        {
            if (!TimeOnly.TryParse(slot.StartTime, out var start) ||
                !TimeOnly.TryParse(slot.EndTime, out var end))
                continue;

            if (end <= start) continue;

            var dayOfWeek = (DayOfWeek)(slot.DayOfWeek % 7);
            db.AvailabilitySlots.Add(
                AvailabilitySlot.Create(tenantId, provider.Id, dayOfWeek, start, end));
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
