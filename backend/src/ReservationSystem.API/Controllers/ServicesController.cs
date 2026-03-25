using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Services.Commands;
using ReservationSystem.Application.Services.Queries;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/services")]
[Authorize]
public class ServicesController(IMediator mediator) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyServicesQuery(), ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetMine), result);
    }

    [HttpPut("{serviceId:guid}")]
    public async Task<IActionResult> Update(Guid serviceId, [FromBody] UpdateServiceCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command with { ServiceId = serviceId }, ct);
        return Ok(result);
    }

    [HttpDelete("{serviceId:guid}")]
    public async Task<IActionResult> Delete(Guid serviceId, CancellationToken ct)
    {
        await mediator.Send(new DeleteServiceCommand(serviceId), ct);
        return NoContent();
    }
}
