using MediatR;
using ReservationSystem.Application.Bookings.Queries.GetMyBookings;

namespace ReservationSystem.Application.Admin.Queries.GetAdminUsers;

public record GetAdminUsersQuery(string? Role = null, int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<AdminUserDto>>;

public record AdminUserDto(
    Guid Id,
    string FullName,
    string Email,
    string Role,
    DateTimeOffset CreatedAt,
    DateTimeOffset? LastLoginAt
);
