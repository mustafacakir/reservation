using MediatR;
using ReservationSystem.Application.Bookings.Queries.GetMyBookings;

namespace ReservationSystem.Application.ServiceProviders.Queries.SearchProviders;

public record SearchProvidersQuery(
    string? Specialization = null,
    decimal? MaxRate = null,
    bool? IsAccepting = true,
    int Page = 1,
    int PageSize = 12
) : IRequest<PagedResult<ProviderSummaryDto>>;

public record ProviderSummaryDto(
    Guid Id,
    Guid UserId,
    string FullName,
    string? AvatarUrl,
    string Bio,
    List<string> Specializations,
    decimal? HourlyRate,
    string Currency,
    decimal AverageRating,
    int TotalReviews,
    bool IsAcceptingClients
);
