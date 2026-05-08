using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Availability.Queries.GetMyWeeklySlots;

public record WeeklySlotDto(int DayOfWeek, string StartTime, string EndTime);

public record GetMyWeeklySlotsQuery : IRequest<List<WeeklySlotDto>>;

public class GetMyWeeklySlotsQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetMyWeeklySlotsQuery, List<WeeklySlotDto>>
{
    public async Task<List<WeeklySlotDto>> Handle(
        GetMyWeeklySlotsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        return await db.AvailabilitySlots
            .Where(s => s.ProviderId == provider.Id && s.IsActive)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .Select(s => new WeeklySlotDto(
                (int)s.DayOfWeek,
                s.StartTime.ToString("HH:mm"),
                s.EndTime.ToString("HH:mm")))
            .ToListAsync(cancellationToken);
    }
}
