using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Availability.Queries.GetMyDateSlots;

public class GetMyDateSlotsQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetMyDateSlotsQuery, List<DateSlotDto>>
{
    public async Task<List<DateSlotDto>> Handle(
        GetMyDateSlotsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        var exceptions = await db.AvailabilityExceptions
            .Where(e =>
                e.ProviderId == provider.Id &&
                e.Type == AvailabilityExceptionType.CustomHours &&
                e.Date >= request.From &&
                e.Date <= request.To &&
                e.CustomStartTime.HasValue && e.CustomEndTime.HasValue)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.CustomStartTime)
            .ToListAsync(cancellationToken);

        return exceptions
            .GroupBy(e => e.Date)
            .Select(g => new DateSlotDto(
                g.Key.ToString("yyyy-MM-dd"),
                g.Select(e => new TimeRangeDto(
                    e.CustomStartTime!.Value.ToString("HH:mm"),
                    e.CustomEndTime!.Value.ToString("HH:mm")))
                 .ToList()))
            .ToList();
    }
}
