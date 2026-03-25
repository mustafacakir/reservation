using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Users.Commands.LoginUser;

public class LoginUserCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    ITenantService tenantService)
    : IRequestHandler<LoginUserCommand, LoginUserResult>
{
    public async Task<LoginUserResult> Handle(LoginUserCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId
            ?? throw new UnauthorizedException("Tenant context is required.");

        var user = await db.Users.FirstOrDefaultAsync(
            u => u.TenantId == tenantId && u.Email == request.Email.ToLowerInvariant(),
            cancellationToken)
            ?? throw new UnauthorizedException("Invalid email or password.");

        if (!passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedException("Invalid email or password.");

        var refreshToken = jwtTokenService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTimeOffset.UtcNow.AddDays(30));
        user.RecordLogin();

        await db.SaveChangesAsync(cancellationToken);

        var accessToken = jwtTokenService.GenerateAccessToken(user);

        return new LoginUserResult(user.Id, user.FullName, user.Role.ToString(), accessToken, refreshToken);
    }
}
