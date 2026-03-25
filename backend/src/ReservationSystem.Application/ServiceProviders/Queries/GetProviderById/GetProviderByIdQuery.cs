using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.ServiceProviders.Queries.GetProviderById;

public record GetProviderByIdQuery(Guid ProviderId) : IRequest<ProviderDetailDto>;

public record ProviderDetailDto(
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
    bool IsAcceptingClients,
    List<ServiceDto> Services);

public record ServiceDto(
    Guid Id,
    string Name,
    string Description,
    int DurationMinutes,
    decimal Price,
    string Currency);

public class GetProviderByIdQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetProviderByIdQuery, ProviderDetailDto>
{
    public async Task<ProviderDetailDto> Handle(
        GetProviderByIdQuery request, CancellationToken cancellationToken)
    {
        var provider = await db.ServiceProviders
            .Include(p => p.User)
            .Include(p => p.Services)
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == request.ProviderId, cancellationToken)
            ?? throw new NotFoundException("Provider", request.ProviderId);

        return new ProviderDetailDto(
            provider.Id,
            provider.UserId,
            provider.User.FullName,
            provider.User.AvatarUrl,
            provider.Bio,
            provider.Specializations,
            provider.HourlyRate,
            provider.Currency,
            provider.AverageRating,
            provider.TotalReviews,
            provider.IsAcceptingClients,
            provider.Services
                .Where(s => s.IsActive)
                .Select(s => new ServiceDto(
                    s.Id, s.Name, s.Description,
                    s.DurationMinutes, s.Price, s.Currency))
                .ToList());
    }
}
