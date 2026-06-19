using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Options;
using ReservationSystem.Application.Payments;
using ReservationSystem.Application.Payments.Commands.CreateBookingFromPayment;
using ReservationSystem.Application.Payments.Commands.InitializePayment;
using ReservationSystem.Infrastructure.Payment;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/payments")]
public class PaymentsController(
    IMediator mediator,
    IIyzicoPaymentService iyzicoService,
    IPendingPaymentStore pendingStore,
    PayTrPaymentService payTrService,
    KuveytTurkPaymentService kuveytTurkService,
    IDistributedCache cache,
    IOptions<IyzicoOptions> iyzicoOpts,
    IOptions<PayTrOptions> payTrOpts,
    IOptions<KuveytTurkOptions> kuveytTurkOpts) : ControllerBase
{
    // ── Initialize (PayTR by default) ──────────────────────────────────────────

    [HttpPost("initialize")]
    [Authorize]
    public async Task<IActionResult> Initialize(
        [FromBody] InitializePaymentCommand command, CancellationToken ct)
    {
        var userIp = HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "127.0.0.1";
        var result = await mediator.Send(command with { UserIp = userIp }, ct);

        return Ok(new
        {
            gatewayType  = result.GatewayType,
            formContent  = result.FormContent,
            iframeToken  = result.IframeToken,
            pendingKey   = result.PendingKey,
            // backward compat fields
            checkoutFormContent = result.FormContent,
            token = result.PendingKey,
        });
    }

    // ── iyzico callback (legacy, browser POST redirect) ────────────────────────

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> IyzicoCallback([FromForm] string token, CancellationToken ct)
    {
        var frontendUrl = iyzicoOpts.Value.FrontendBaseUrl;
        try
        {
            var (success, _, error) = await iyzicoService.VerifyAsync(token, ct);
            if (!success)
                return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString(error ?? "Ödeme başarısız")}");

            var pending = await pendingStore.RetrieveAsync(token, ct);
            if (pending is null)
                return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString("Ödeme bilgisi bulunamadı")}");

            var bookingId = await mediator.Send(new CreateBookingFromPaymentCommand(pending), ct);
            return Redirect($"{frontendUrl}/client/payment-result?success=true&bookingId={bookingId}");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString(ex.Message)}");
        }
    }

    // ── PayTR server-to-server notification ────────────────────────────────────

    [HttpPost("paytr/notify")]
    [AllowAnonymous]
    public async Task<IActionResult> PayTrNotify(CancellationToken ct)
    {
        var form = Request.Form;
        var merchantOid = form["merchant_oid"].ToString();
        var status      = form["status"].ToString();
        var totalAmount = form["total_amount"].ToString();
        var hash        = form["hash"].ToString();

        if (!payTrService.VerifyNotification(merchantOid, status, totalAmount, hash, out _))
            return Content("INVALID_HASH");

        try
        {
            if (status == "success")
            {
                var pending = await pendingStore.RetrieveAsync(merchantOid, ct);
                if (pending is not null)
                {
                    var bookingId = await mediator.Send(new CreateBookingFromPaymentCommand(pending), ct);
                    await cache.SetStringAsync(
                        $"paytr:result:{merchantOid}",
                        bookingId.ToString(),
                        new DistributedCacheEntryOptions
                        {
                            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10)
                        }, ct);
                }
            }
        }
        catch
        {
            // Always return OK to PayTR even on internal errors
        }

        return Content("OK");
    }

    // ── PayTR browser redirect after successful payment ────────────────────────

    [HttpGet("paytr/complete")]
    [AllowAnonymous]
    public async Task<IActionResult> PayTrComplete([FromQuery] string oid, CancellationToken ct)
    {
        var frontendUrl = payTrOpts.Value.FrontendBaseUrl;

        // Notification fires before browser redirect; poll up to ~3 seconds
        for (int i = 0; i < 6; i++)
        {
            var bookingIdStr = await cache.GetStringAsync($"paytr:result:{oid}", ct);
            if (bookingIdStr is not null)
                return Redirect($"{frontendUrl}/client/payment-result?success=true&bookingId={bookingIdStr}");

            if (i < 5) await Task.Delay(500, ct);
        }

        return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString("Ödeme işlemi zaman aşımına uğradı, lütfen derslerinizi kontrol edin.")}");
    }

    // ── KuveytTürk 3D Secure callback (OkUrl — browser POST after successful 3DS) ──

    [HttpPost("kuveytturk/callback")]
    [AllowAnonymous]
    public async Task<IActionResult> KuveytTurkCallback(CancellationToken ct)
    {
        var frontendUrl = kuveytTurkOpts.Value.FrontendBaseUrl;
        try
        {
            var (success, merchantOrderId, error) =
                await kuveytTurkService.HandleCallbackAsync(Request.Form, ct);

            if (!success)
                return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString(error ?? "Ödeme başarısız")}");

            var pending = await pendingStore.RetrieveAsync(merchantOrderId!, ct);
            if (pending is null)
                return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString("Ödeme bilgisi bulunamadı")}");

            var bookingId = await mediator.Send(new CreateBookingFromPaymentCommand(pending), ct);
            return Redirect($"{frontendUrl}/client/payment-result?success=true&bookingId={bookingId}");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString(ex.Message)}");
        }
    }

    // ── KuveytTürk FailUrl (browser POST after failed/cancelled 3DS) ──────────

    [HttpPost("kuveytturk/fail")]
    [AllowAnonymous]
    public IActionResult KuveytTurkFail(ILogger<PaymentsController> logger)
    {
        var form = Request.Form;
        foreach (var key in form.Keys)
            logger.LogWarning("KT Fail form field: {Key}={Value}", key, form[key]);

        var frontendUrl = kuveytTurkOpts.Value.FrontendBaseUrl;
        return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString("Ödeme iptal edildi veya başarısız oldu")}");
    }
}
