using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Availability.Commands.SetWeeklyAvailability;
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
}
