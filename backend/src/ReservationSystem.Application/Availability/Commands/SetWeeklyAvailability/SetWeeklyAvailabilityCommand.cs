using MediatR;

namespace ReservationSystem.Application.Availability.Commands.SetWeeklyAvailability;

public record WeeklySlotRequest(int DayOfWeek, string StartTime, string EndTime);

public record SetWeeklyAvailabilityCommand(List<WeeklySlotRequest> Slots) : IRequest;
