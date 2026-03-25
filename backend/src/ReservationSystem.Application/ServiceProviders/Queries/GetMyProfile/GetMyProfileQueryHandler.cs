using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.ServiceProviders.Queries.GetMyProfile;

public class GetMyProfileQueryHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser)
    : IRequestHandler<GetMyProfileQuery, MyProfileDto>
{
    public async Task<MyProfileDto> Handle(GetMyProfileQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();

        var provider = await db.ServiceProviders
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken)
            ?? throw new NotFoundException("ServiceProvider", userId);

        return new MyProfileDto(
            provider.User.FirstName,
            provider.User.LastName,
            provider.User.AvatarUrl,
            provider.Bio,
            provider.Specializations,
            provider.HourlyRate,
            provider.Currency);
    }
}
