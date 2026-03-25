using MediatR;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Tenants.Queries.GetTenantBySlug;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/tenants")]
public class TenantsController(ISender sender) : ControllerBase
{
    /// <summary>
    /// Public endpoint — intentionally exempt from tenant middleware
    /// (see TenantExemptPaths). Returns tenant metadata needed by the frontend
    /// to initialise the tenant store before any authenticated calls.
    /// </summary>
    [HttpGet("{slug}")]
    [ProducesResponseType(typeof(TenantDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken ct)
    {
        try
        {
            var dto = await sender.Send(new GetTenantBySlugQuery(slug), ct);
            return Ok(dto);
        }
        catch (NotFoundException)
        {
            return NotFound(new { error = $"Tenant '{slug}' not found." });
        }
    }
}
