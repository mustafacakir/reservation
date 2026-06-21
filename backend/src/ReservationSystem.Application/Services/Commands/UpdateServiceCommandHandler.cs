using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Services.Queries;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Services.Commands;

public record UpdateServiceCommand(
    Guid ServiceId,
    string Name,
    string Description,
    int DurationMinutes,
    decimal Price,
    string Currency,
    string SessionType = "Individual",
    int? MaxParticipants = null,
    int? RecurrenceWeeks = null,
    DateTimeOffset? ScheduledStart = null,
    DateTimeOffset? ScheduledEnd = null,
    string? ZoomLink = null,
    string? ZoomMeetingId = null,
    string? ZoomPassword = null
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

        var sessionType = Enum.TryParse<SessionType>(request.SessionType, out var st)
            ? st : Domain.Enums.SessionType.Individual;

        service.Update(
            request.Name, request.Description, request.DurationMinutes,
            request.Price, string.IsNullOrWhiteSpace(request.Currency) ? "TRY" : request.Currency,
            60, sessionType,
            sessionType == Domain.Enums.SessionType.Group ? request.MaxParticipants : null,
            sessionType == Domain.Enums.SessionType.Group ? request.RecurrenceWeeks : null,
            request.ScheduledStart,
            request.ScheduledEnd,
            request.ZoomLink, request.ZoomMeetingId, request.ZoomPassword);

        await db.SaveChangesAsync(cancellationToken);

        var totalBookings = await db.Bookings.CountAsync(b =>
            b.ServiceId == service.Id &&
            b.Status != BookingStatus.Cancelled &&
            b.Status != BookingStatus.NoShow, cancellationToken);

        return new ServiceDto(service.Id, service.Name, service.Description,
            service.DurationMinutes, service.Price, service.Currency, service.IsActive,
            service.SessionType.ToString(), service.MaxParticipants, totalBookings,
            service.RecurrenceWeeks, service.ScheduledStart, service.ScheduledEnd,
            service.ZoomLink, service.ZoomMeetingId, service.ZoomPassword);
    }
}
