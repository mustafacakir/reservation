using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Services.Queries;

public record GetMyServicesQuery : IRequest<List<ServiceDto>>;

public record ServiceDto(
    Guid Id,
    string Name,
    string Description,
    int DurationMinutes,
    decimal Price,
    string Currency,
    bool IsActive
);

public class GetMyServicesQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetMyServicesQuery, List<ServiceDto>>
{
    public async Task<List<ServiceDto>> Handle(GetMyServicesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        return await db.Services
            .Where(s => s.ProviderId == provider.Id && s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new ServiceDto(s.Id, s.Name, s.Description, s.DurationMinutes, s.Price, s.Currency, s.IsActive))
            .ToListAsync(cancellationToken);
    }
}
