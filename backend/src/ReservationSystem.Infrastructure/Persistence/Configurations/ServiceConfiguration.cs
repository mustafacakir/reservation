using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence.Configurations;

public class ServiceConfiguration : IEntityTypeConfiguration<Service>
{
    public void Configure(EntityTypeBuilder<Service> builder)
    {
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Name).HasMaxLength(200).IsRequired();
        builder.Property(s => s.Description).HasMaxLength(2000);
        builder.Property(s => s.Price).HasPrecision(10, 2);
        builder.Property(s => s.Currency).HasMaxLength(3);

        builder.HasIndex(s => new { s.TenantId, s.ProviderId, s.IsActive });
    }
}
