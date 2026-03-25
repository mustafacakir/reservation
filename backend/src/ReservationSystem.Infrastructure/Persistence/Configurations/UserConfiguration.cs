using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Email).HasMaxLength(256).IsRequired();
        builder.Property(u => u.FirstName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.LastName).HasMaxLength(100).IsRequired();
        builder.Property(u => u.AvatarUrl).HasMaxLength(500);

        // Unique email per tenant
        builder.HasIndex(u => new { u.TenantId, u.Email }).IsUnique();

        builder.HasOne(u => u.ServiceProviderProfile)
            .WithOne(p => p.User)
            .HasForeignKey<Domain.Entities.ServiceProvider>(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
