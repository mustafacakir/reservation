using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence.Configurations;

public class BookingConfiguration : IEntityTypeConfiguration<Booking>
{
    public void Configure(EntityTypeBuilder<Booking> builder)
    {
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Price).HasPrecision(10, 2).IsRequired();
        builder.Property(b => b.Currency).HasMaxLength(3).IsRequired();
        builder.Property(b => b.ClientNotes).HasMaxLength(1000);
        builder.Property(b => b.ProviderNotes).HasMaxLength(1000);
        builder.Property(b => b.CancellationReason).HasMaxLength(500);

        builder.HasIndex(b => new { b.ProviderId, b.StartUtc, b.EndUtc });
        builder.HasIndex(b => new { b.TenantId, b.Status });
        builder.HasIndex(b => b.ClientId);

        builder.HasOne(b => b.Service).WithMany(s => s.Bookings)
            .HasForeignKey(b => b.ServiceId).OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Client).WithMany()
            .HasForeignKey(b => b.ClientId).OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(b => b.Review).WithOne(r => r.Booking)
            .HasForeignKey<Review>(r => r.BookingId).OnDelete(DeleteBehavior.Cascade);
    }
}
