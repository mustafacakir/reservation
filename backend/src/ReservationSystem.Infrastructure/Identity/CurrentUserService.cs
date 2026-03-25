using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Infrastructure.Identity;

public class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public Guid? UserId
    {
        get
        {
            var claim = Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? Principal?.FindFirst("sub")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public Guid? TenantId
    {
        get
        {
            var claim = Principal?.FindFirst("tenant_id")?.Value;
            return Guid.TryParse(claim, out var id) ? id : null;
        }
    }

    public UserRole? Role
    {
        get
        {
            var claim = Principal?.FindFirst("role")?.Value;
            return Enum.TryParse<UserRole>(claim, out var role) ? role : null;
        }
    }

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated ?? false;
}
