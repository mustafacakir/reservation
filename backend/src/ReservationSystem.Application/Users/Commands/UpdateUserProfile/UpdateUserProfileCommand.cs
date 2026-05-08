using MediatR;

namespace ReservationSystem.Application.Users.Commands.UpdateUserProfile;

public record UpdateUserProfileCommand(string FirstName, string LastName) : IRequest<UpdateUserProfileResult>;

public record UpdateUserProfileResult(string FullName);
