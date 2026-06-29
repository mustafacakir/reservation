using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Application.Payments;
using ReservationSystem.Infrastructure.BackgroundServices;
using ReservationSystem.Infrastructure.Email;
using ReservationSystem.Infrastructure.Identity;
using ReservationSystem.Infrastructure.Payment;
using ReservationSystem.Infrastructure.Persistence;
using ReservationSystem.Infrastructure.Sms;
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

        // Payment gateways
        services.Configure<IyzicoOptions>(configuration.GetSection("Iyzico"));
        services.AddScoped<IIyzicoPaymentService, IyzicoPaymentService>();
        services.Configure<PayTrOptions>(configuration.GetSection("PayTr"));
        services.AddScoped<PayTrPaymentService>();
        services.Configure<KuveytTurkOptions>(configuration.GetSection("KuveytTurk"));
        services.AddScoped<KuveytTurkPaymentService>();
        services.AddScoped<IPaymentGateway, KuveytTurkPaymentService>();
        services.AddScoped<IPendingPaymentStore, PendingPaymentStore>();
        services.AddHttpClient("PayTr");
        services.AddHttpClient("KuveytTurk");

        // Email
        services.Configure<EmailSettings>(configuration.GetSection("Email"));
        services.AddScoped<IEmailService, BrevoEmailService>();
        services.AddHostedService<BookingReminderBackgroundService>();

        // SMS
        services.Configure<NetGsmOptions>(configuration.GetSection("NetGsm"));
        services.AddHttpClient("NetGsm");
        services.AddScoped<ISmsService, NetGsmSmsService>();

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

                // SignalR sends JWT via query string since WebSocket headers are restricted
                options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
                {
                    OnMessageReceived = ctx =>
                    {
                        var token = ctx.Request.Query["access_token"];
                        if (!string.IsNullOrEmpty(token) &&
                            ctx.Request.Path.StartsWithSegments("/hubs"))
                        {
                            ctx.Token = token;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

        services.AddAuthorizationBuilder()
            .AddPolicy("RequireAdmin", p => p.RequireClaim("role", "Admin", "SuperAdmin"))
            .AddPolicy("RequireServiceProvider", p => p.RequireClaim("role", "ServiceProvider"))
            .AddPolicy("RequireSuperAdmin", p => p.RequireClaim("role", "SuperAdmin"));

        return services;
    }
}
