using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    IOptions<IyzicoOptions> iyzicoOpts) : ControllerBase
{
    [HttpPost("initialize")]
    [Authorize]
    public async Task<IActionResult> Initialize(
        [FromBody] InitializePaymentCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return Ok(new { checkoutFormContent = result.CheckoutFormContent, token = result.Token });
    }

    /// <summary>
    /// Called by iyzico (browser POST redirect) after payment attempt.
    /// Verifies payment, creates booking, and redirects to frontend.
    /// </summary>
    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback([FromForm] string token, CancellationToken ct)
    {
        var frontendUrl = iyzicoOpts.Value.FrontendBaseUrl;

        try
        {
            var (success, paymentId, error) = await iyzicoService.VerifyAsync(token, ct);

            if (!success)
                return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString(error ?? "Ödeme başarısız")}");

            var pendingData = await pendingStore.RetrieveAsync(token, ct);
            if (pendingData is null)
                return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString("Ödeme bilgisi bulunamadı")}");

            var bookingId = await mediator.Send(new CreateBookingFromPaymentCommand(pendingData), ct);

            return Redirect($"{frontendUrl}/client/payment-result?success=true&bookingId={bookingId}");
        }
        catch (Exception ex)
        {
            return Redirect($"{frontendUrl}/client/payment-result?success=false&error={Uri.EscapeDataString(ex.Message)}");
        }
    }
}
