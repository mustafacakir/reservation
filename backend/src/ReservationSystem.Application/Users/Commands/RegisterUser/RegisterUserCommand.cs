using MediatR;

namespace ReservationSystem.Application.Users.Commands.RegisterUser;

public record RegisterUserCommand(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    bool IsEmailSubscribed = false
) : IRequest<RegisterUserResult>;

public record RegisterUserResult(
    Guid UserId,
    string AccessToken,
    string RefreshToken
);
