using MediatR;

namespace ReservationSystem.Application.Availability.Commands.RemoveDateAvailability;

public record RemoveDateAvailabilityCommand(string Date) : IRequest;
