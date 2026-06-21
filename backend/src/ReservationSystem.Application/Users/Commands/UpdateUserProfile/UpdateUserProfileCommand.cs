using MediatR;

namespace ReservationSystem.Application.Users.Commands.UpdateUserProfile;

public record UpdateUserProfileCommand(string FirstName, string LastName, bool IsEmailSubscribed = false) : IRequest<UpdateUserProfileResult>;

public record UpdateUserProfileResult(string FullName, bool IsEmailSubscribed);
