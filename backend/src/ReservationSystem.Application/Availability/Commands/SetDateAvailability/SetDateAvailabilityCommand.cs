using MediatR;

namespace ReservationSystem.Application.Availability.Commands.SetDateAvailability;

public record TimeRangeRequest(string StartTime, string EndTime);
public record SetDateAvailabilityCommand(string Date, List<TimeRangeRequest> Ranges, int RepeatWeeks = 1) : IRequest;
