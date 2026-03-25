using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Domain.Exceptions;
using System.Text.Json;
using ApplicationException = ReservationSystem.Application.Common.Exceptions;

namespace ReservationSystem.API.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, message, errors) = exception switch
        {
            NotFoundException e => (StatusCodes.Status404NotFound, e.Message, (IReadOnlyList<string>?)[]),
            ValidationException e => (StatusCodes.Status422UnprocessableEntity, "Validation failed", e.Errors),
            UnauthorizedException e => (StatusCodes.Status401Unauthorized, e.Message, null),
            ForbiddenException e => (StatusCodes.Status403Forbidden, e.Message, null),
            ConflictException e => (StatusCodes.Status409Conflict, e.Message, null),
            DomainException e => (StatusCodes.Status400BadRequest, e.Message, null),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", null)
        };

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = statusCode;

        var response = new
        {
            status = statusCode,
            message,
            errors = errors?.Count > 0 ? errors : null
        };

        await context.Response.WriteAsync(JsonSerializer.Serialize(response,
            new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
    }
}
