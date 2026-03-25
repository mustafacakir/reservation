using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ReservationSystem.Domain.Entities;
using ReservationSystem.Domain.Enums;

namespace ReservationSystem.Infrastructure.Persistence.Seeders;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<ApplicationDbContext>>();

        await db.Database.MigrateAsync();

        if (!await db.Tenants.IgnoreQueryFilters().AnyAsync())
        {
            logger.LogInformation("Seeding demo data...");
            await SeedDemoTenantsAsync(db);
            logger.LogInformation("Demo data seeded successfully.");
        }
    }

    private static async Task SeedDemoTenantsAsync(ApplicationDbContext db)
    {
        // Demo tenant 1: Math tutoring
        var mathTenant = Tenant.Create("Math Masters Academy", "math-masters", "tutoring", PlanTier.Pro);
        mathTenant.UpdateSettings(new TenantSettings
        {
            Currency = "USD",
            TimeZone = "America/New_York",
            DefaultSessionDurationMinutes = 60,
            CancellationWindowHours = 24,
            PrimaryColor = "#4F46E5"
        });

        // Demo tenant 2: Psychology counseling
        var psychTenant = Tenant.Create("MindSpace Counseling", "mindspace", "psychology", PlanTier.Pro);
        psychTenant.UpdateSettings(new TenantSettings
        {
            Currency = "USD",
            TimeZone = "America/Chicago",
            DefaultSessionDurationMinutes = 50,
            CancellationWindowHours = 48,
            PrimaryColor = "#059669"
        });

        await db.Tenants.AddRangeAsync(mathTenant, psychTenant);
        await db.SaveChangesAsync();
    }
}
