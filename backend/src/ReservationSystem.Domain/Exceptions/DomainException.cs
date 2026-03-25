namespace ReservationSystem.Domain.Exceptions;

public class DomainException(string message) : Exception(message);

public class BookingException(string message) : DomainException(message);

public class SlotNotAvailableException(DateTimeOffset startUtc)
    : DomainException($"The requested time slot starting at {startUtc:O} is not available.");

public class TenantNotFoundException(string slug)
    : DomainException($"Tenant with slug '{slug}' was not found.");
