using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Availability.Queries.GetAvailableSlots;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.ServiceProviders.Commands.UpdateMyProfile;
using ReservationSystem.Application.ServiceProviders.Queries.GetMyProfile;
using ReservationSystem.Application.ServiceProviders.Queries.GetProviderById;
using ReservationSystem.Application.ServiceProviders.Queries.SearchProviders;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/providers")]
public class ServiceProvidersController(IMediator mediator) : ControllerBase
{
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile(CancellationToken ct)
    {
        var result = await mediator.Send(new GetMyProfileQuery(), ct);
        return Ok(result);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateMyProfileCommand command, CancellationToken ct)
    {
        await mediator.Send(command, ct);
        return NoContent();
    }

    [HttpGet]
    public async Task<IActionResult> Search(
        [FromQuery] string? specialization,
        [FromQuery] decimal? maxRate,
        [FromQuery] bool? isAccepting = true,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new SearchProvidersQuery(specialization, maxRate, isAccepting, page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{providerId:guid}")]
    public async Task<IActionResult> GetById(Guid providerId, CancellationToken ct = default)
    {
        try
        {
            var result = await mediator.Send(new GetProviderByIdQuery(providerId), ct);
            return Ok(result);
        }
        catch (NotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{providerId:guid}/available-slots")]
    public async Task<IActionResult> GetAvailableSlots(
        Guid providerId,
        [FromQuery] Guid serviceId,
        [FromQuery] DateOnly date,
        CancellationToken ct = default)
    {
        var result = await mediator.Send(
            new GetAvailableSlotsQuery(providerId, serviceId, date), ct);
        return Ok(result);
    }
}
