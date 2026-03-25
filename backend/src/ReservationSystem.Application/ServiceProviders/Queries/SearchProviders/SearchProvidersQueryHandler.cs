using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Bookings.Queries.GetMyBookings;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.ServiceProviders.Queries.SearchProviders;

public class SearchProvidersQueryHandler(IApplicationDbContext db)
    : IRequestHandler<SearchProvidersQuery, PagedResult<ProviderSummaryDto>>
{
    public async Task<PagedResult<ProviderSummaryDto>> Handle(
        SearchProvidersQuery request, CancellationToken cancellationToken)
    {
        var query = db.ServiceProviders
            .Include(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Specialization))
            query = query.Where(p => p.Specializations.Contains(request.Specialization));

        if (request.MaxRate.HasValue)
            query = query.Where(p => p.HourlyRate == null || p.HourlyRate <= request.MaxRate);

        if (request.IsAccepting.HasValue)
            query = query.Where(p => p.IsAcceptingClients == request.IsAccepting);

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(p => p.AverageRating)
            .ThenByDescending(p => p.TotalReviews)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProviderSummaryDto(
                p.Id, p.UserId, p.User.FullName, p.User.AvatarUrl,
                p.Bio, p.Specializations, p.HourlyRate, p.Currency,
                p.AverageRating, p.TotalReviews, p.IsAcceptingClients))
            .ToListAsync(cancellationToken);

        return new PagedResult<ProviderSummaryDto>(items, total, request.Page, request.PageSize);
    }
}
