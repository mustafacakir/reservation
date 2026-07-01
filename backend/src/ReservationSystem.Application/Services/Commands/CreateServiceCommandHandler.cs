using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Services.Queries;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Application.Services.Commands;

public record CreateServiceCommand(
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
    string? ZoomPassword = null,
    int SortOrder = 0,
    Guid? SeriesId = null
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

        var sessionType = Enum.TryParse<SessionType>(request.SessionType, out var st)
            ? st : Domain.Enums.SessionType.Individual;

        var service = Domain.Entities.Service.Create(
            tenantId, provider.Id,
            request.Name, request.Description,
            request.DurationMinutes, request.Price,
            string.IsNullOrWhiteSpace(request.Currency) ? "TRY" : request.Currency,
            sessionType,
            sessionType == Domain.Enums.SessionType.Group ? request.MaxParticipants : null,
            request.RecurrenceWeeks,
            request.ScheduledStart,
            request.ScheduledEnd,
            request.ZoomLink, request.ZoomMeetingId, request.ZoomPassword, request.SeriesId);

        service.SetSortOrder(request.SortOrder);
        await db.Services.AddAsync(service, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new ServiceDto(service.Id, service.Name, service.Description,
            service.DurationMinutes, service.Price, service.Currency, service.IsActive,
            service.SessionType.ToString(), service.MaxParticipants, 0, service.SortOrder,
            service.RecurrenceWeeks, service.ScheduledStart, service.ScheduledEnd,
            service.ZoomLink, service.ZoomMeetingId, service.ZoomPassword, service.SeriesId);
    }
}
