using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Availability.Queries.GetAvailableSlots;

public class GetAvailableSlotsQueryHandler(
    IApplicationDbContext db,
    ITenantService tenantService)
    : IRequestHandler<GetAvailableSlotsQuery, List<AvailableSlotDto>>
{
    public async Task<List<AvailableSlotDto>> Handle(
        GetAvailableSlotsQuery request, CancellationToken cancellationToken)
    {
        // 1. Load service
        var service = await db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Service), request.ServiceId);

        var isGroup = service.SessionType == SessionType.Group;

        // 2. Group service with fixed schedule: bypass weekly availability entirely
        if (isGroup && service.ScheduledStart.HasValue)
        {
            var tenant2 = await tenantService.GetCurrentTenantAsync(cancellationToken);
            var tzInfo2 = GetTimeZoneInfo(tenant2?.Settings.TimeZone ?? "Europe/Istanbul");

            int weeks = service.RecurrenceWeeks ?? 1;
            for (int w = 0; w < weeks; w++)
            {
                var slotStart = service.ScheduledStart.Value.AddDays(7 * w);
                var slotLocalDate = DateOnly.FromDateTime(
                    TimeZoneInfo.ConvertTimeFromUtc(slotStart.UtcDateTime, tzInfo2));

                if (slotLocalDate != request.Date) continue;
                if (slotStart <= DateTimeOffset.UtcNow) return [];

                var slotEnd = service.ScheduledEnd.HasValue
                    ? service.ScheduledEnd.Value.AddDays(7 * w)
                    : slotStart.AddMinutes(service.DurationMinutes);

                var startLocal = TimeZoneInfo.ConvertTimeFromUtc(slotStart.UtcDateTime, tzInfo2).ToString("HH:mm");
                var endLocal = TimeZoneInfo.ConvertTimeFromUtc(slotEnd.UtcDateTime, tzInfo2).ToString("HH:mm");

                var count = await db.Bookings.CountAsync(b =>
                    b.ServiceId == request.ServiceId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.NoShow &&
                    b.StartUtc == slotStart,
                    cancellationToken);

                var isFull = service.MaxParticipants.HasValue && count >= service.MaxParticipants.Value;

                return [new AvailableSlotDto(
                    StartUtc: slotStart,
                    EndUtc: slotEnd,
                    StartLocal: startLocal,
                    EndLocal: endLocal,
                    IsGroup: true,
                    MaxParticipants: service.MaxParticipants,
                    CurrentParticipants: count,
                    IsFull: isFull)];
            }

            return []; // Requested date is not a scheduled date for this group lesson
        }

        // 3. Check for availability exception on this date
        var exception = await db.AvailabilityExceptions
            .FirstOrDefaultAsync(e =>
                e.ProviderId == request.ProviderId &&
                e.Date == request.Date, cancellationToken);

        if (exception?.Type == AvailabilityExceptionType.DayOff)
            return [];

        // 4. Determine time windows for this day
        List<(TimeOnly Start, TimeOnly End)> windows;

        if (exception?.Type == AvailabilityExceptionType.CustomHours
            && exception.CustomStartTime.HasValue && exception.CustomEndTime.HasValue)
        {
            windows = [(exception.CustomStartTime.Value, exception.CustomEndTime.Value)];
        }
        else
        {
            var weeklySlots = await db.AvailabilitySlots
                .Where(s =>
                    s.ProviderId == request.ProviderId &&
                    s.DayOfWeek == request.Date.DayOfWeek &&
                    s.IsActive)
                .OrderBy(s => s.StartTime)
                .ToListAsync(cancellationToken);

            if (weeklySlots.Count == 0) return [];

            windows = weeklySlots.Select(s => (s.StartTime, s.EndTime)).ToList();
        }

        // 5. Get tenant timezone
        var tenant = await tenantService.GetCurrentTenantAsync(cancellationToken);
        var tzInfo = GetTimeZoneInfo(tenant?.Settings.TimeZone ?? "Europe/Istanbul");

        // 6. Generate candidate slots across all windows
        var candidates = windows
            .SelectMany(w => GenerateSlots(request.Date, w.Start, w.End, service.DurationMinutes, tzInfo))
            .OrderBy(s => s.StartUtc)
            .ToList();

        if (candidates.Count == 0) return [];

        var rangeStart = candidates.First().StartUtc;
        var rangeEnd = candidates.Last().EndUtc;

        // 7a. Group (no fixed schedule): return all slots with booking counts
        if (isGroup)
        {
            var groupCounts = await db.Bookings
                .Where(b =>
                    b.ServiceId == request.ServiceId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.NoShow &&
                    b.StartUtc >= rangeStart &&
                    b.StartUtc < rangeEnd)
                .GroupBy(b => b.StartUtc)
                .Select(g => new { StartUtc = g.Key, Count = g.Count() })
                .ToDictionaryAsync(g => g.StartUtc, g => g.Count, cancellationToken);

            return candidates.Select(slot =>
            {
                groupCounts.TryGetValue(slot.StartUtc, out var count);
                var isFull = service.MaxParticipants.HasValue && count >= service.MaxParticipants.Value;
                return slot with
                {
                    IsGroup = true,
                    MaxParticipants = service.MaxParticipants,
                    CurrentParticipants = count,
                    IsFull = isFull,
                };
            }).ToList();
        }

        // 7b. Individual: filter out slots overlapping existing bookings
        var existingBookings = await db.Bookings
            .Where(b =>
                b.ProviderId == request.ProviderId &&
                b.Status != BookingStatus.Cancelled &&
                b.Status != BookingStatus.NoShow &&
                b.StartUtc < rangeEnd &&
                b.EndUtc > rangeStart)
            .Select(b => new { b.StartUtc, b.EndUtc })
            .ToListAsync(cancellationToken);

        return candidates
            .Where(slot => !existingBookings.Any(b =>
                b.StartUtc < slot.EndUtc && b.EndUtc > slot.StartUtc))
            .Select(slot => slot with { IsGroup = false, MaxParticipants = null, CurrentParticipants = 0, IsFull = false })
            .ToList();
    }

    private static List<AvailableSlotDto> GenerateSlots(
        DateOnly date, TimeOnly windowStart, TimeOnly windowEnd,
        int durationMinutes, TimeZoneInfo tzInfo)
    {
        var slots = new List<AvailableSlotDto>();
        var current = windowStart;

        while (current.AddMinutes(durationMinutes) <= windowEnd)
        {
            var startDt = date.ToDateTime(current, DateTimeKind.Unspecified);
            var startUtc = TimeZoneInfo.ConvertTimeToUtc(startDt, tzInfo);
            var endUtc = startUtc.AddMinutes(durationMinutes);

            if (startUtc > DateTimeOffset.UtcNow)
            {
                slots.Add(new AvailableSlotDto(
                    StartUtc: startUtc,
                    EndUtc: endUtc,
                    StartLocal: current.ToString("HH:mm"),
                    EndLocal: current.AddMinutes(durationMinutes).ToString("HH:mm"),
                    IsGroup: false,
                    MaxParticipants: null,
                    CurrentParticipants: 0,
                    IsFull: false
                ));
            }

            current = current.AddMinutes(durationMinutes);
        }

        return slots;
    }

    private static TimeZoneInfo GetTimeZoneInfo(string timeZoneId)
    {
        try { return TimeZoneInfo.FindSystemTimeZoneById(timeZoneId); }
        catch { return TimeZoneInfo.Utc; }
    }
}
