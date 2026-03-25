using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Services.Queries;

namespace ReservationSystem.Application.Services.Commands;

public record UpdateServiceCommand(
    Guid ServiceId,
    string Name,
    string Description,
    int DurationMinutes,
    decimal Price,
    string Currency
) : IRequest<ServiceDto>;

public class UpdateServiceCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateServiceCommand, ServiceDto>
{
    public async Task<ServiceDto> Handle(UpdateServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        var service = await db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.ProviderId == provider.Id, cancellationToken)
            ?? throw new NotFoundException("Service", request.ServiceId);

        service.Update(request.Name, request.Description, request.DurationMinutes,
            request.Price, string.IsNullOrWhiteSpace(request.Currency) ? "TRY" : request.Currency, 60);

        await db.SaveChangesAsync(cancellationToken);

        return new ServiceDto(service.Id, service.Name, service.Description,
            service.DurationMinutes, service.Price, service.Currency, service.IsActive);
    }
}
