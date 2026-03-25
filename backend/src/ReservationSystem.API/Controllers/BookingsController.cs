using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Bookings.Commands.CancelBooking;
using ReservationSystem.Application.Bookings.Commands.CreateBooking;
using ReservationSystem.Application.Bookings.Queries.GetMyBookings;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/bookings")]
[Authorize]
public class BookingsController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBookingCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetMyBookings), new { id = result.BookingId }, result.Booking);
    }

    [HttpGet]
    public async Task<IActionResult> GetMyBookings([FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(new GetMyBookingsQuery(page, pageSize), ct);
        return Ok(result);
    }

    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelBookingRequest body, CancellationToken ct)
    {
        await mediator.Send(new CancelBookingCommand(id, body.Reason), ct);
        return NoContent();
    }
}

public record CancelBookingRequest(string? Reason);
