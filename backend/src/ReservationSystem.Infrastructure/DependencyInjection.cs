using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Payments;
using ReservationSystem.Infrastructure.Identity;
using ReservationSystem.Infrastructure.Payment;
using ReservationSystem.Infrastructure.Persistence;
using ReservationSystem.Infrastructure.Tenancy;
using System.Text;

namespace ReservationSystem.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services, IConfiguration configuration)
    {
        // Tenant service (scoped — one per request)
        services.AddScoped<TenantService>();
        services.AddScoped<ITenantService>(sp => sp.GetRequiredService<TenantService>());

        // Database
        services.AddDbContext<ApplicationDbContext>((sp, options) =>
        {
            options.UseNpgsql(
                configuration.GetConnectionString("DefaultConnection"),
                b =>
                {
                    b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                });
            options.EnableSensitiveDataLogging(false);
        });
        services.AddScoped<IApplicationDbContext>(sp =>
            sp.GetRequiredService<ApplicationDbContext>());

        // Redis
        services.AddStackExchangeRedisCache(options =>
            options.Configuration = configuration["Redis:ConnectionString"]);

        // Iyzico payment
        services.Configure<IyzicoOptions>(configuration.GetSection("Iyzico"));
        services.AddScoped<IIyzicoPaymentService, IyzicoPaymentService>();
        services.AddScoped<IPendingPaymentStore, PendingPaymentStore>();

        // Identity services
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // JWT options
        services.Configure<JwtSettings>(configuration.GetSection("Jwt"));

        // JWT authentication
        var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>()!;
        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtSettings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings.Secret)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy("RequireAdmin", p => p.RequireClaim("role", "Admin", "SuperAdmin"))
            .AddPolicy("RequireServiceProvider", p => p.RequireClaim("role", "ServiceProvider"))
            .AddPolicy("RequireSuperAdmin", p => p.RequireClaim("role", "SuperAdmin"));

        return services;
    }
}
