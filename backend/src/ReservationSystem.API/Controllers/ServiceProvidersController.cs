using MediatR;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Availability.Queries.GetAvailableSlots;
using ReservationSystem.Application.ServiceProviders.Queries.SearchProviders;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/providers")]
public class ServiceProvidersController(IMediator mediator) : ControllerBase
{
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

    [HttpGet("{providerId}/available-slots")]
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
