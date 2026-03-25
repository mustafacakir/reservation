using MediatR;
using Microsoft.AspNetCore.Mvc;
using ReservationSystem.Application.Users.Commands.LoginUser;
using ReservationSystem.Application.Users.Commands.RegisterUser;

namespace ReservationSystem.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IMediator mediator) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterUserCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return CreatedAtAction(nameof(Register), new { id = result.UserId }, result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginUserCommand command, CancellationToken ct)
    {
        var result = await mediator.Send(command, ct);
        return Ok(result);
    }
}
