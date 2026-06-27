using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Availability.Commands.RemoveDateAvailability;
using ReservationSystem.Application.Availability.Commands.SetDateAvailability;
using ReservationSystem.Application.Availability.Commands.SetWeeklyAvailability;
using ReservationSystem.Application.Availability.Queries.GetMyDateSlots;
using ReservationSystem.Application.Availability.Queries.GetMyWeeklySlots;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/availability")]
[Authorize]
public class AvailabilityController(IMediator mediator) : ControllerBase
{
    [HttpGet("me/weekly")]
    public async Task<IActionResult> GetMyWeeklySlots(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyWeeklySlotsQuery(), ct);
        return Ok(result);
    }

    [HttpPut("me/weekly")]
    public async Task<IActionResult> SetWeeklyAvailability(
        [FromBody] SetWeeklyAvailabilityCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet("me/dates")]
    public async Task<IActionResult> GetMyDateSlots(
        [FromQuery] string from, [FromQuery] string to, CancellationToken ct)
    {
        if (!DateOnly.TryParse(from, out var fromDate) || !DateOnly.TryParse(to, out var toDate))
            return BadRequest("Geçersiz tarih formatı.");
        var result = await mediator.Send(new GetMyDateSlotsQuery(fromDate, toDate), ct);
        return Ok(result);
    }

    [HttpPut("me/date")]
    public async Task<IActionResult> SetDateAvailability(
        [FromBody] SetDateAvailabilityCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }

    [HttpDelete("me/date/{date}")]
    public async Task<IActionResult> RemoveDateAvailability(string date, CancellationToken ct)
    {
        await mediator.Send(new RemoveDateAvailabilityCommand(date), ct);
        return NoContent();
    }
}
