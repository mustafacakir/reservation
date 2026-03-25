using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.ServiceProviders.Commands.UpdateMyProfile;

public class UpdateMyProfileCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateMyProfileCommand>
{
    public async Task Handle(UpdateMyProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var provider = await db.ServiceProviders
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        user.UpdateProfile(request.FirstName, request.LastName, request.AvatarUrl);
        provider.UpdateProfile(request.Bio, request.Specializations, request.HourlyRate, request.Currency);

        await db.SaveChangesAsync(cancellationToken);
    }
}
