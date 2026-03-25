using System.Reflection;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Common;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ITenantService _tenantService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Domain.Entities.ServiceProvider> ServiceProviders => Set<Domain.Entities.ServiceProvider>();
    public DbSet<Service> Services => Set<Service>();
    public DbSet<AvailabilitySlot> AvailabilitySlots => Set<AvailabilitySlot>();
    public DbSet<AvailabilityException> AvailabilityExceptions => Set<AvailabilityException>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<Review> Reviews => Set<Review>();

    // EF Core evaluates this property on the CURRENT context instance at query time
    // (not the instance from OnModelCreating, which is why we expose it as a property)
    private Guid? CurrentTenantId => _tenantService.CurrentTenantId;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Exclude domain event types — they are not persisted
        modelBuilder.Ignore<Domain.Common.DomainEvent>();
        modelBuilder.Ignore<Domain.Events.BookingCreatedEvent>();
        modelBuilder.Ignore<Domain.Events.BookingConfirmedEvent>();
        modelBuilder.Ignore<Domain.Events.BookingCancelledEvent>();

        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        ApplyTenantQueryFilters(modelBuilder);
    }

    private void ApplyTenantQueryFilters(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (!typeof(ITenantEntity).IsAssignableFrom(entityType.ClrType)) continue;

            var method = typeof(ApplicationDbContext)
                .GetMethod(nameof(SetTenantFilter), BindingFlags.NonPublic | BindingFlags.Instance)!
                .MakeGenericMethod(entityType.ClrType);

            method.Invoke(this, [modelBuilder]);
        }
    }

    // 'this' is passed to EF Core filter — EF Core substitutes the current
    // DbContext instance when building each query, so CurrentTenantId is
    // evaluated per-request, not at model build time.
    private void SetTenantFilter<T>(ModelBuilder builder)
        where T : class, ITenantEntity
    {
        builder.Entity<T>().HasQueryFilter(e => e.TenantId == this.CurrentTenantId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entitiesWithEvents = ChangeTracker.Entries<BaseEntity>()
            .Where(e => e.Entity.DomainEvents.Any())
            .Select(e => e.Entity)
            .ToList();

        var result = await base.SaveChangesAsync(cancellationToken);

        foreach (var entity in entitiesWithEvents)
            entity.ClearDomainEvents();

        return result;
    }
}
