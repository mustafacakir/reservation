using FluentValidation;

namespace ReservationSystem.Application.Bookings.Commands.CreateBooking;

public class CreateBookingCommandValidator : AbstractValidator<CreateBookingCommand>
{
    public CreateBookingCommandValidator()
    {
        RuleFor(x => x.ServiceId).NotEmpty();
        RuleFor(x => x.ProviderId).NotEmpty();
        RuleFor(x => x.StartUtc)
            .NotEmpty()
            .GreaterThan(DateTimeOffset.UtcNow)
            .WithMessage("Booking start time must be in the future.");
        RuleFor(x => x.ClientNotes).MaximumLength(1000).When(x => x.ClientNotes != null);
    }
}
