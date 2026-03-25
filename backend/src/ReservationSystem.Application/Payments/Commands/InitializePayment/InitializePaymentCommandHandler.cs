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
    IIyzicoPaymentService iyzicoService,
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

        // Check for booking conflicts
        var endUtc = request.StartUtc.AddMinutes(service.DurationMinutes);
        var hasConflict = await db.Bookings
            .AnyAsync(b =>
                b.ProviderId == request.ProviderId &&
                b.Status != BookingStatus.Cancelled &&
                b.Status != BookingStatus.NoShow &&
                b.StartUtc < endUtc &&
                b.EndUtc > request.StartUtc,
                cancellationToken);

        if (hasConflict)
            throw new SlotNotAvailableException(request.StartUtc);

        // Initialize iyzico checkout form
        var (formContent, token) = await iyzicoService.InitializeAsync(
            userId, user.Email, user.FirstName, user.LastName,
            service.Id, service.Name, service.Price,
            cancellationToken);

        // Store pending booking data in Redis keyed by iyzico token
        await pendingStore.StoreAsync(token, new PendingPaymentData(
            userId, tenantId, service.Id, request.ProviderId, request.StartUtc, request.ClientNotes),
            TimeSpan.FromMinutes(30), cancellationToken);

        return new InitializePaymentResult(formContent, token);
    }
}
