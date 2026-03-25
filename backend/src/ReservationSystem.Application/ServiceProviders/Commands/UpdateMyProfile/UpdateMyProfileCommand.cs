using MediatR;

namespace ReservationSystem.Application.ServiceProviders.Commands.UpdateMyProfile;

public record UpdateMyProfileCommand(
    string FirstName,
    string LastName,
    string Bio,
    List<string> Specializations,
    decimal? HourlyRate,
    string Currency,
    string? AvatarUrl
) : IRequest;
