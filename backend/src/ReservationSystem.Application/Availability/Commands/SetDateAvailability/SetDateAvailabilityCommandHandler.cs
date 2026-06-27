using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Application.Availability.Commands.SetDateAvailability;

public class SetDateAvailabilityCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService)
    : IRequestHandler<SetDateAvailabilityCommand>
{
    public async Task Handle(SetDateAvailabilityCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var tenantId = tenantService.CurrentTenantId ?? throw new UnauthorizedException("Tenant context is required.");

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        if (!DateOnly.TryParse(request.Date, out var date))
            throw new ValidationException(["Geçersiz tarih formatı."]);

        if (request.Ranges is null || request.Ranges.Count == 0)
            throw new ValidationException(["En az bir saat aralığı gereklidir."]);

        var parsedRanges = new List<(TimeOnly Start, TimeOnly End)>();
        foreach (var r in request.Ranges)
        {
            if (!TimeOnly.TryParse(r.StartTime, out var start) || !TimeOnly.TryParse(r.EndTime, out var end))
                throw new ValidationException(["Geçersiz saat formatı."]);
            if (end <= start)
                throw new ValidationException(["Bitiş saati başlangıçtan sonra olmalıdır."]);
            parsedRanges.Add((start, end));
        }

        // Clear recurring weekly slots — switch to date-based mode
        var weeklySlots = await db.AvailabilitySlots
            .Where(s => s.ProviderId == provider.Id)
            .ToListAsync(cancellationToken);
        db.AvailabilitySlots.RemoveRange(weeklySlots);

        int weeks = Math.Max(1, Math.Min(request.RepeatWeeks, 52));

        // For each week, remove existing exceptions and create new ones
        for (int w = 0; w < weeks; w++)
        {
            var targetDate = date.AddDays(7 * w);

            var existing = await db.AvailabilityExceptions
                .Where(e => e.ProviderId == provider.Id && e.Date == targetDate)
                .ToListAsync(cancellationToken);
            db.AvailabilityExceptions.RemoveRange(existing);

            foreach (var (start, end) in parsedRanges)
            {
                db.AvailabilityExceptions.Add(
                    AvailabilityException.CreateCustomHours(tenantId, provider.Id, targetDate, start, end));
            }
        }

        await db.SaveChangesAsync(cancellationToken);
    }
}
