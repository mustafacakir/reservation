using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Services.Commands;

public record DeleteServiceCommand(Guid ServiceId) : IRequest;

public class DeleteServiceCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<DeleteServiceCommand>
{
    public async Task Handle(DeleteServiceCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        var service = await db.Services
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.ProviderId == provider.Id, cancellationToken)
            ?? throw new NotFoundException("Service", request.ServiceId);

        service.Deactivate();
        await db.SaveChangesAsync(cancellationToken);
    }
}
