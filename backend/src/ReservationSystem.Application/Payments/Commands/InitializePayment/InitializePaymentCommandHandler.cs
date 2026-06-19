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

        var endUtc = request.StartUtc.AddMinutes(service.DurationMinutes);

        bool hasConflict;
        if (service.SessionType == Domain.Enums.SessionType.Group && service.MaxParticipants.HasValue)
        {
            var participantCount = await db.Bookings
                .CountAsync(b =>
                    b.ServiceId == service.Id &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.NoShow &&
                    b.StartUtc == request.StartUtc,
                    cancellationToken);
            hasConflict = participantCount >= service.MaxParticipants.Value;
        }
        else
        {
            hasConflict = await db.Bookings
                .AnyAsync(b =>
                    b.ProviderId == request.ProviderId &&
                    b.Status != BookingStatus.Cancelled &&
                    b.Status != BookingStatus.NoShow &&
                    b.StartUtc < endUtc &&
                    b.EndUtc > request.StartUtc,
                    cancellationToken);
        }

        if (hasConflict)
            throw new SlotNotAvailableException(request.StartUtc);

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
            request.CardCvv);

        var gatewayResult = await paymentGateway.InitializeAsync(gatewayRequest, cancellationToken);

        await pendingStore.StoreAsync(
            gatewayResult.PendingKey,
            new PendingPaymentData(userId, tenantId, service.Id, request.ProviderId, request.StartUtc, request.ClientNotes),
            TimeSpan.FromMinutes(30),
            cancellationToken);

        return new InitializePaymentResult(
            gatewayResult.GatewayType,
            gatewayResult.FormContent,
            gatewayResult.IframeToken,
            gatewayResult.PendingKey);
    }
}
