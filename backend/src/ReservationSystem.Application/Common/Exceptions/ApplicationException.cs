namespace ReservationSystem.Application.Common.Exceptions;

public class NotFoundException(string entityName, object key)
    : Exception($"'{entityName}' with key '{key}' was not found.");

public class ValidationException(IEnumerable<string> errors)
    : Exception("One or more validation errors occurred.")
{
    public IReadOnlyList<string> Errors { get; } = errors.ToList();
}

public class UnauthorizedException(string message = "You are not authorized to perform this action.")
    : Exception(message);

public class ForbiddenException(string message = "You do not have permission to perform this action.")
    : Exception(message);

public class ConflictException(string message) : Exception(message);
