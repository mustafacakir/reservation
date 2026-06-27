using MediatR;

namespace ReservationSystem.Application.Availability.Queries.GetMyDateSlots;

public record GetMyDateSlotsQuery(DateOnly From, DateOnly To)
    : IRequest<List<DateSlotDto>>;

public record TimeRangeDto(string StartTime, string EndTime);
public record DateSlotDto(string Date, List<TimeRangeDto> Ranges);
