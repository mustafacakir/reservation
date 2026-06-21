using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Payments;
using ReservationSystem.Infrastructure.Payment;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/pay")]
[AllowAnonymous]
public class PaymentLinksController(
    IApplicationDbContext db,
    IPaymentGateway paymentGateway,
    IPendingPaymentStore pendingStore,
    IOptions<KuveytTurkOptions> kuveytTurkOpts) : ControllerBase
{
    // ── GET /api/v1/pay/{token} — booking summary ─────────────────────────────

    [HttpGet("{token}")]
    public async Task<IActionResult> GetSummary(string token, CancellationToken ct)
    {
        var booking = await db.Bookings
            .IgnoreQueryFilters()
            .Include(b => b.Service).ThenInclude(s => s.Provider).ThenInclude(p => p.User)
            .FirstOrDefaultAsync(b => b.PaymentLinkToken == token, ct);

        if (booking is null)
            return NotFound(new { message = "Ödeme linki bulunamadı." });

        return Ok(new
        {
            bookingId      = booking.Id,
            status         = booking.Status.ToString(),
            serviceName    = booking.Service.Name,
            providerName   = booking.Service.Provider.User.FullName,
            startUtc       = booking.StartUtc,
            endUtc         = booking.EndUtc,
            price          = booking.Price,
            currency       = booking.Currency,
            clientNotes    = booking.ClientNotes,
        });
    }

    // ── POST /api/v1/pay/{token}/initialize — start KuveytTürk 3DS ───────────

    [HttpPost("{token}/initialize")]
    public async Task<IActionResult> Initialize(
        string token,
        [FromBody] PaymentLinkInitRequest request,
        CancellationToken ct)
    {
        var booking = await db.Bookings
            .IgnoreQueryFilters()
            .Include(b => b.Service).ThenInclude(s => s.Provider)
            .FirstOrDefaultAsync(b => b.PaymentLinkToken == token, ct);

        if (booking is null)
            return NotFound(new { message = "Ödeme linki bulunamadı." });

        if (booking.Status.ToString() != "Pending")
            return BadRequest(new { message = "Bu ödeme linki artık geçerli değil." });

        var userIp = HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "127.0.0.1";
        var merchantOrderId = Guid.NewGuid().ToString("N");

        var gatewayRequest = new GatewayInitRequest(
            merchantOrderId,
            booking.ClientId,
            request.Email ?? "odeme@pekinteknoloji.com",
            request.FirstName ?? "Öğrenci",
            request.LastName ?? "",
            booking.ServiceId,
            booking.Service.Name,
            booking.Price,
            userIp,
            request.CardNumber,
            request.CardHolderName,
            request.CardExpireMonth,
            request.CardExpireYear,
            request.CardCvv);

        var gatewayResult = await paymentGateway.InitializeAsync(gatewayRequest, ct);

        await pendingStore.StoreAsync(
            gatewayResult.PendingKey,
            new PendingPaymentData(
                booking.ClientId,
                booking.TenantId,
                booking.ServiceId,
                booking.ProviderId,
                booking.StartUtc,
                booking.ClientNotes,
                ExistingBookingId: booking.Id,
                IsPaymentLink: true,
                PaymentLinkToken: token,
                StudentEmail: request.Email),
            TimeSpan.FromMinutes(30),
            ct);

        return Ok(new
        {
            gatewayType = gatewayResult.GatewayType,
            formContent = gatewayResult.FormContent,
            pendingKey  = gatewayResult.PendingKey,
        });
    }
}

public record PaymentLinkInitRequest(
    string? Email,
    string? FirstName,
    string? LastName,
    string? CardNumber,
    string? CardHolderName,
    string? CardExpireMonth,
    string? CardExpireYear,
    string? CardCvv
);
