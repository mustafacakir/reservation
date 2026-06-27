using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Enums;
using ReservationSystem.Domain.Exceptions;

namespace ReservationSystem.Application.Payments.Commands.InitializePayment;

public class InitializePaymentCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    ITenantService tenantService,
    IPaymentGateway paymentGateway,
    IPendingPaymentStore pendingStore)
    : IRequestHandler<InitializePaymentCommand, InitializePaymentResult>
{
    public async Task<InitializePaymentResult> Handle(
        InitializePaymentCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UnauthorizedException();
        var tenantId = tenantService.CurrentTenantId ?? throw new UnauthorizedException();

        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new NotFoundException("User", userId);

        var service = await db.Services
            .Include(s => s.Provider)
            .FirstOrDefaultAsync(s => s.Id == request.ServiceId && s.IsActive, cancellationToken)
            ?? throw new NotFoundException("Service", request.ServiceId);

        if (service.ProviderId != request.ProviderId)
            throw new ValidationException(["Service does not belong to the specified provider."]);

        // Use fixed ScheduledStart for any session type that has one set
        var effectiveStartUtc = service.ScheduledStart.HasValue
            ? service.ScheduledStart.Value
            : request.StartUtc;

        var blockMinutes = (service.ScheduledStart.HasValue && service.ScheduledEnd.HasValue)
            ? (int)(service.ScheduledEnd.Value - service.ScheduledStart.Value).TotalMinutes
            : service.DurationMinutes;

        int weeks = service.RecurrenceWeeks ?? 1;

        if (service.SessionType == Domain.Enums.SessionType.Group && service.MaxParticipants.HasValue)
        {
            // Check capacity for each weekly occurrence
            for (int w = 0; w < weeks; w++)
            {
                var slotStart = effectiveStartUtc.AddDays(7 * w);
                var participantCount = await db.Bookings
                    .CountAsync(b =>
                        b.ServiceId == service.Id &&
                        b.Status != BookingStatus.Cancelled &&
                        b.Status != BookingStatus.NoShow &&
                        b.StartUtc == slotStart,
                        cancellationToken);
                if (participantCount >= service.MaxParticipants.Value)
                    throw new SlotNotAvailableException(slotStart);
            }
        }
        else
        {
            // Individual: check no overlap for any of the recurring weeks
            for (int w = 0; w < weeks; w++)
            {
                var slotStart = effectiveStartUtc.AddDays(7 * w);
                var slotEnd = slotStart.AddMinutes(blockMinutes);
                var hasConflict = await db.Bookings
                    .AnyAsync(b =>
                        b.ProviderId == request.ProviderId &&
                        b.Status != BookingStatus.Cancelled &&
                        b.Status != BookingStatus.NoShow &&
                        b.StartUtc < slotEnd &&
                        b.EndUtc > slotStart,
                        cancellationToken);
                if (hasConflict)
                    throw new SlotNotAvailableException(slotStart);
            }
        }

        var merchantOrderId = Guid.NewGuid().ToString("N");

        var gatewayRequest = new GatewayInitRequest(
            merchantOrderId,
            userId,
            user.Email,
            user.FirstName,
            user.LastName,
            service.Id,
            service.Name,
            service.Price,
            request.UserIp,
            request.CardNumber,
            request.CardHolderName,
            request.CardExpireMonth,
            request.CardExpireYear,
            request.CardCvv,
            user.PhoneNumber);

        var gatewayResult = await paymentGateway.InitializeAsync(gatewayRequest, cancellationToken);

        await pendingStore.StoreAsync(
            gatewayResult.PendingKey,
            new PendingPaymentData(userId, tenantId, service.Id, request.ProviderId, effectiveStartUtc, request.ClientNotes),
            TimeSpan.FromMinutes(30),
            cancellationToken);

        return new InitializePaymentResult(
            gatewayResult.GatewayType,
            gatewayResult.FormContent,
            gatewayResult.IframeToken,
            gatewayResult.PendingKey);
    }
}
