using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Common.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    Guid? TenantId { get; }
    UserRole? Role { get; }
    bool IsAuthenticated { get; }
}
