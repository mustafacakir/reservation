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
        // 1. Load service to get duration
        var service = await db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(Domain.Entities.Service), request.ServiceId);

        // 2. Check for availability exception on this date
        var exception = await db.AvailabilityExceptions
            .FirstOrDefaultAsync(e =>
                e.ProviderId == request.ProviderId &&
                e.Date == request.Date, cancellationToken);

        if (exception?.Type == AvailabilityExceptionType.DayOff)
            return [];

        // 3. Determine working window for this date
        TimeOnly windowStart, windowEnd;

        if (exception?.Type == AvailabilityExceptionType.CustomHours
            && exception.CustomStartTime.HasValue && exception.CustomEndTime.HasValue)
        {
            windowStart = exception.CustomStartTime.Value;
            windowEnd = exception.CustomEndTime.Value;
        }
        else
        {
            // Load weekly slot for this day of week
            var weeklySlot = await db.AvailabilitySlots
                .FirstOrDefaultAsync(s =>
                    s.ProviderId == request.ProviderId &&
                    s.DayOfWeek == request.Date.DayOfWeek &&
                    s.IsActive, cancellationToken);

            if (weeklySlot == null) return [];

            windowStart = weeklySlot.StartTime;
            windowEnd = weeklySlot.EndTime;
        }

        // 4. Get tenant timezone
        var tenant = await tenantService.GetCurrentTenantAsync(cancellationToken);
        var tzInfo = GetTimeZoneInfo(tenant?.Settings.TimeZone ?? "UTC");

        // 5. Generate candidate slots
        var candidates = GenerateSlots(request.Date, windowStart, windowEnd,
            service.DurationMinutes, tzInfo);

        if (candidates.Count == 0) return [];

        // 6. Load existing bookings (Pending or Confirmed) for the day
        var dayStart = candidates.First().StartUtc;
        var dayEnd = candidates.Last().EndUtc;

        var existingBookings = await db.Bookings
            .Where(b =>
                b.ProviderId == request.ProviderId &&
                b.Status != BookingStatus.Cancelled &&
                b.Status != BookingStatus.NoShow &&
                b.StartUtc < dayEnd &&
                b.EndUtc > dayStart)
            .Select(b => new { b.StartUtc, b.EndUtc })
            .ToListAsync(cancellationToken);

        // 7. Filter out conflicting slots
        return candidates
            .Where(slot => !existingBookings.Any(b =>
                b.StartUtc < slot.EndUtc && b.EndUtc > slot.StartUtc))
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

            // Don't return slots in the past
            if (startUtc > DateTimeOffset.UtcNow)
            {
                slots.Add(new AvailableSlotDto(
                    StartUtc: startUtc,
                    EndUtc: endUtc,
                    StartLocal: current.ToString("HH:mm"),
                    EndLocal: current.AddMinutes(durationMinutes).ToString("HH:mm")
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
