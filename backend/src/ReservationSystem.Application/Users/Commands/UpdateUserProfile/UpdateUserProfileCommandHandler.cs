using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Users.Commands.UpdateUserProfile;

public class UpdateUserProfileCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<UpdateUserProfileCommand, UpdateUserProfileResult>
{
    public async Task<UpdateUserProfileResult> Handle(UpdateUserProfileCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UnauthorizedException("Not authenticated.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        user.UpdateProfile(request.FirstName, request.LastName, user.AvatarUrl, request.IsEmailSubscribed);
        await db.SaveChangesAsync(cancellationToken);

        return new UpdateUserProfileResult(user.FullName, user.IsEmailSubscribed);
    }
}
