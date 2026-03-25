using MediatR;

namespace ReservationSystem.Application.Users.Commands.RefreshToken;

public record RefreshTokenCommand(string RefreshToken) : IRequest<RefreshTokenResult>;

public record RefreshTokenResult(string AccessToken, string RefreshToken);
