using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.HasKey(t => t.Id);
        builder.Property(t => t.Name).HasMaxLength(200).IsRequired();
        builder.Property(t => t.Slug).HasMaxLength(100).IsRequired();
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.Property(t => t.Sector).HasMaxLength(100).IsRequired();

        builder.OwnsOne(t => t.Settings, s =>
        {
            s.ToJson();
            s.Property(p => p.Currency).HasMaxLength(3);
            s.Property(p => p.TimeZone).HasMaxLength(100);
        });

        builder.HasMany(t => t.Users).WithOne(u => u.Tenant)
            .HasForeignKey(u => u.TenantId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Services).WithOne(s => s.Tenant)
            .HasForeignKey(s => s.TenantId).OnDelete(DeleteBehavior.Restrict);
    }
}
