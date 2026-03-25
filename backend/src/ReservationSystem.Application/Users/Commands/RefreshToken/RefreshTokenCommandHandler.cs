using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Users.Commands.RefreshToken;

public class RefreshTokenCommandHandler(
    IApplicationDbContext db,
    IJwtTokenService jwtTokenService,
    ITenantService tenantService)
    : IRequestHandler<RefreshTokenCommand, RefreshTokenResult>
{
    public async Task<RefreshTokenResult> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId
            ?? throw new UnauthorizedException("Tenant context required.");

        var user = await db.Users.FirstOrDefaultAsync(
            u => u.TenantId == tenantId && u.RefreshToken == request.RefreshToken,
            cancellationToken)
            ?? throw new UnauthorizedException("Invalid refresh token.");

        if (user.RefreshTokenExpiresAt < DateTimeOffset.UtcNow)
            throw new UnauthorizedException("Refresh token has expired.");

        var newRefreshToken = jwtTokenService.GenerateRefreshToken();
        user.SetRefreshToken(newRefreshToken, DateTimeOffset.UtcNow.AddDays(30));
        await db.SaveChangesAsync(cancellationToken);

        var accessToken = jwtTokenService.GenerateAccessToken(user);

        return new RefreshTokenResult(accessToken, newRefreshToken);
    }
}
