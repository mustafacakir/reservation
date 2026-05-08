using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Bookings.Queries.GetMyBookings;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Admin.Queries.GetAdminUsers;

public class GetAdminUsersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminUsersQuery, PagedResult<AdminUserDto>>
{
    public async Task<PagedResult<AdminUserDto>> Handle(GetAdminUsersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Role) &&
            Enum.TryParse<UserRole>(request.Role, ignoreCase: true, out var roleEnum))
        {
            query = query.Where(u => u.Role == roleEnum);
        }
        else
        {
            query = query.Where(u => u.Role == UserRole.Client || u.Role == UserRole.ServiceProvider);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(u => new AdminUserDto(
                u.Id,
                u.FullName,
                u.Email,
                u.Role.ToString(),
                u.CreatedAt,
                u.LastLoginAt))
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminUserDto>(items, total, request.Page, request.PageSize);
    }
}
