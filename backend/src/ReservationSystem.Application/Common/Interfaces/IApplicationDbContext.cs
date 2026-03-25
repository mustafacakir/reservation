using Microsoft.EntityFrameworkCore;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Tenant> Tenants { get; }
    DbSet<User> Users { get; }
    DbSet<Domain.Entities.ServiceProvider> ServiceProviders { get; }
    DbSet<Service> Services { get; }
    DbSet<AvailabilitySlot> AvailabilitySlots { get; }
    DbSet<AvailabilityException> AvailabilityExceptions { get; }
    DbSet<Booking> Bookings { get; }
    DbSet<Review> Reviews { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);
}
