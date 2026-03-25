using MediatR;

namespace ReservationSystem.Application.ServiceProviders.Queries.GetMyProfile;

public record GetMyProfileQuery : IRequest<MyProfileDto>;

public record MyProfileDto(
    string FirstName,
    string LastName,
    string? AvatarUrl,
    string Bio,
    List<string> Specializations,
    decimal? HourlyRate,
    string Currency
);
