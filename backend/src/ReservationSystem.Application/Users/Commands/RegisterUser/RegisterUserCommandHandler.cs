using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Users.Commands.RegisterUser;

public class RegisterUserCommandHandler(
    IApplicationDbContext db,
    IPasswordHasher passwordHasher,
    IJwtTokenService jwtTokenService,
    ITenantService tenantService)
    : IRequestHandler<RegisterUserCommand, RegisterUserResult>
{
    public async Task<RegisterUserResult> Handle(RegisterUserCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId
            ?? throw new UnauthorizedException("Tenant context is required.");

        var emailExists = await db.Users.AnyAsync(
            u => u.TenantId == tenantId && u.Email == request.Email.ToLowerInvariant(),
            cancellationToken);

        if (emailExists)
            throw new ConflictException($"Email '{request.Email}' is already registered.");

        var passwordHash = passwordHasher.Hash(request.Password);
        var user = User.Create(tenantId, request.Email, passwordHash,
            request.FirstName, request.LastName, UserRole.Client);

        var refreshToken = jwtTokenService.GenerateRefreshToken();
        user.SetRefreshToken(refreshToken, DateTimeOffset.UtcNow.AddDays(30));

        await db.Users.AddAsync(user, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var accessToken = jwtTokenService.GenerateAccessToken(user);

        return new RegisterUserResult(user.Id, accessToken, refreshToken);
    }
}
