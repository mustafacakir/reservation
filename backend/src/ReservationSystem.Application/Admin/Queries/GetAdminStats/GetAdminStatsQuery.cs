using MediatR;

namespace ReservationSystem.Application.Admin.Queries.GetAdminStats;

public record GetAdminStatsQuery : IRequest<AdminStatsDto>;

public record AdminStatsDto(
    int TotalUsers,
    int TotalProviders,
    int TotalClients,
    int TotalBookings,
    int PendingBookings,
    int ConfirmedBookings,
    int CompletedBookings,
    int CancelledBookings,
    decimal TotalRevenue
);
