using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Application.Bookings.Common;

/// <summary>Expands a Service (and its multi-day siblings sharing SeriesId, if any) into concrete weekly occurrences.</summary>
public static class ServiceSeriesExpander
{
    public record Occurrence(Service Member, DateTimeOffset StartUtc, DateTimeOffset EndUtc);

    public static async Task<List<Service>> ResolveMembersAsync(
        IApplicationDbContext db, Service anchor, CancellationToken cancellationToken)
    {
        if (!anchor.SeriesId.HasValue)
            return [anchor];

        return await db.Services
            .IgnoreQueryFilters()
            .Where(s => s.SeriesId == anchor.SeriesId && s.IsActive)
            .ToListAsync(cancellationToken);
    }

    public static List<Occurrence> Expand(
        IEnumerable<Service> members, DateTimeOffset fallbackStartForAnchor, Guid anchorId)
    {
        var occurrences = new List<Occurrence>();

        foreach (var member in members)
        {
            var start = member.ScheduledStart
                ?? (member.Id == anchorId
                    ? fallbackStartForAnchor
                    : throw new InvalidOperationException("Series member is missing a ScheduledStart."));

            var blockMinutes = (member.ScheduledStart.HasValue && member.ScheduledEnd.HasValue)
                ? (int)(member.ScheduledEnd.Value - member.ScheduledStart.Value).TotalMinutes
                : member.DurationMinutes;

            var weeks = member.RecurrenceWeeks ?? 1;

            for (var w = 0; w < weeks; w++)
            {
                var occurrenceStart = start.AddDays(7 * w);
                occurrences.Add(new Occurrence(member, occurrenceStart, occurrenceStart.AddMinutes(blockMinutes)));
            }
        }

        return occurrences;
    }
}
