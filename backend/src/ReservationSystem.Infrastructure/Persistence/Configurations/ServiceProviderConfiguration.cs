using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ReservationSystem.Infrastructure.Persistence.Configurations;

public class ServiceProviderConfiguration : IEntityTypeConfiguration<Domain.Entities.ServiceProvider>
{
    public void Configure(EntityTypeBuilder<Domain.Entities.ServiceProvider> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Bio).HasMaxLength(2000);
        builder.Property(p => p.Currency).HasMaxLength(3);
        builder.Property(p => p.HourlyRate).HasPrecision(10, 2);
        builder.Property(p => p.AverageRating).HasPrecision(3, 2);

        // Specializations stored as native PostgreSQL text array
        builder.Property(p => p.Specializations)
            .HasColumnType("text[]");

        builder.HasIndex(p => p.UserId).IsUnique();
        builder.HasIndex(p => new { p.TenantId, p.IsAcceptingClients });

        builder.HasMany(p => p.Services).WithOne(s => s.Provider)
            .HasForeignKey(s => s.ProviderId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.AvailabilitySlots).WithOne(s => s.Provider)
            .HasForeignKey(s => s.ProviderId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.AvailabilityExceptions).WithOne(e => e.Provider)
            .HasForeignKey(e => e.ProviderId).OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Bookings).WithOne(b => b.Provider)
            .HasForeignKey(b => b.ProviderId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Reviews).WithOne(r => r.Provider)
            .HasForeignKey(r => r.ProviderId).OnDelete(DeleteBehavior.Restrict);
    }
}
