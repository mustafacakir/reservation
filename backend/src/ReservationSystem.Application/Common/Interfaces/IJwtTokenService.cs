using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Guid? GetUserIdFromExpiredToken(string token);
}
