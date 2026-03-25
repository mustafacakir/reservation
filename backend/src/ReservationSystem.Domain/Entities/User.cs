using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Domain.Entities;

public class User : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; private set; }
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string FirstName { get; private set; } = default!;
    public string LastName { get; private set; } = default!;
    public string? AvatarUrl { get; private set; }
    public UserRole Role { get; private set; }
    public bool IsEmailVerified { get; private set; }
    public string? RefreshToken { get; private set; }
    public DateTimeOffset? RefreshTokenExpiresAt { get; private set; }
    public DateTimeOffset? LastLoginAt { get; private set; }

    // Navigation
    public Tenant Tenant { get; private set; } = default!;
    public ServiceProvider? ServiceProviderProfile { get; private set; }

    public string FullName => $"{FirstName} {LastName}";

    private User() { }

    public static User Create(Guid tenantId, string email, string passwordHash,
        string firstName, string lastName, UserRole role)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(passwordHash);

        return new User
        {
            TenantId = tenantId,
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Role = role
        };
    }

    public void UpdateProfile(string firstName, string lastName, string? avatarUrl)
    {
        FirstName = firstName.Trim();
        LastName = lastName.Trim();
        AvatarUrl = avatarUrl;
        SetUpdatedAt();
    }

    public void SetRefreshToken(string token, DateTimeOffset expiresAt)
    {
        RefreshToken = token;
        RefreshTokenExpiresAt = expiresAt;
        SetUpdatedAt();
    }

    public void RevokeRefreshToken()
    {
        RefreshToken = null;
        RefreshTokenExpiresAt = null;
        SetUpdatedAt();
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTimeOffset.UtcNow;
        SetUpdatedAt();
    }

    public void VerifyEmail()
    {
        IsEmailVerified = true;
        SetUpdatedAt();
    }

    public void ChangeRole(UserRole role) { Role = role; SetUpdatedAt(); }
}
