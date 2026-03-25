using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;

namespace ReservationSystem.Infrastructure.Persistence;

/// <summary>
/// Used only by EF Core CLI tools (dotnet ef migrations add/update).
/// Provides a DbContext instance without requiring the full DI container.
/// </summary>
public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var config = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Database=reservation_db;Username=reservation_user;Password=devpassword";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql(connectionString,
            b => b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));

        return new ApplicationDbContext(optionsBuilder.Options, new DesignTimeTenantService());
    }
}

/// <summary>Stub tenant service for design-time — returns null so no query filter is applied.</summary>
internal class DesignTimeTenantService : ITenantService
{
    public Guid? CurrentTenantId => null;
    public string? CurrentTenantSlug => null;
    public Task<Tenant?> GetCurrentTenantAsync(CancellationToken ct = default) => Task.FromResult<Tenant?>(null);
    public Task<Tenant?> GetBySlugAsync(string slug, CancellationToken ct = default) => Task.FromResult<Tenant?>(null);
}
