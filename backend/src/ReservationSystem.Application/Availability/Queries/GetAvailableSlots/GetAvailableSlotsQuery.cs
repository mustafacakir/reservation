using MediatR;

namespace ReservationSystem.Application.Availability.Queries.GetAvailableSlots;

public record GetAvailableSlotsQuery(
    Guid ProviderId,
    Guid ServiceId,
    DateOnly Date
) : IRequest<List<AvailableSlotDto>>;

public record AvailableSlotDto(
    DateTimeOffset StartUtc,
    DateTimeOffset EndUtc,
    string StartLocal,
    string EndLocal,
    bool IsGroup,
    int? MaxParticipants,
    int CurrentParticipants,
    bool IsFull,
    bool IsBooked = false
);
