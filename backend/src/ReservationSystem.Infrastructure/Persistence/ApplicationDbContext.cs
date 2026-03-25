using System.Reflection;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    ITenantService tenantService)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Domain.Entities.ServiceProvider> ServiceProviders => Set<Domain.Entities.ServiceProvider>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<AvailabilityException> AvailabilityExceptions => Set<AvailabilityException>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        ApplyTenantQueryFilters(modelBuilder);
    }

    private void ApplyTenantQueryFilters(ModelBuilder modelBuilder)
    {
        // Apply global tenant filter to all ITenantEntity types
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType)) continue;

            var method = typeof(ApplicationDbContext)
                .GetMethod(nameof(SetTenantFilter), BindingFlags.NonPublic | BindingFlags.Static)!
                .MakeGenericMethod(entityType.ClrType);

            method.Invoke(null, [modelBuilder, tenantService]);
        }
    }

    private static void SetTenantFilter<T>(ModelBuilder builder, ITenantService svc)
        where T : class, ITenantEntity
    {
        builder.Entity<T>().HasQueryFilter(e => e.TenantId == svc.CurrentTenantId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Dispatch domain events before saving
        var entitiesWithEvents = ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.Entity.DomainEvents.Any())
            .Select(e => e.Entity)
            .ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        // Clear events after successful save
        foreach (var entity in entitiesWithEvents)
            entity.ClearDomainEvents();

        return result;
    }
}
