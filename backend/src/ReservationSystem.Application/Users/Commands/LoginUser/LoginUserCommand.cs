using MediatR;

namespace ReservationSystem.Application.Users.Commands.LoginUser;

public record LoginUserCommand(string Email, string Password) : IRequest<LoginUserResult>;

public record LoginUserResult(
    Guid UserId,
    string FullName,
    string Role,
    string AccessToken,
    string RefreshToken
);
