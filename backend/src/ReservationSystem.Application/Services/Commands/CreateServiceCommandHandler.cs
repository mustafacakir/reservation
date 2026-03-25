using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Services.Queries;

namespace ReservationSystem.Application.Services.Commands;

public record CreateServiceCommand(
    string Name,
    string Description,
    int DurationMinutes,
    decimal Price,
    string Currency
) : IRequest<ServiceDto>;

public class CreateServiceCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService)
    : IRequestHandler<CreateServiceCommand, ServiceDto>
{
    public async Task<ServiceDto> Handle(CreateServiceCommand request, CancellationToken cancellationToken)
    {
        var tenantId = tenantService.CurrentTenantId ?? throw new UnauthorizedException();
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        var service = Domain.Entities.Service.Create(
            tenantId, provider.Id,
            request.Name, request.Description,
            request.DurationMinutes, request.Price,
            string.IsNullOrWhiteSpace(request.Currency) ? "TRY" : request.Currency);

        await db.Services.AddAsync(service, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new ServiceDto(service.Id, service.Name, service.Description,
            service.DurationMinutes, service.Price, service.Currency, service.IsActive);
    }
}
