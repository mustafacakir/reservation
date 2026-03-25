using ReservationSystem.Application;
using ReservationSystem.Infrastructure;
using ReservationSystem.Infrastructure.Persistence.Seeders;
using ReservationSystem.Infrastructure.Tenancy;
using ReservationSystem.API.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .CreateLogger();

builder.Host.UseSerilog();

// Application layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);

// API
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "ReservationSystem API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new()
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter JWT token"
    });
    c.AddSecurityRequirement(new()
    {
        {
            new() { Reference = new() { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"])
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

var app = builder.Build();

// Seed database
if (app.Environment.IsDevelopment())
{
    await DatabaseSeeder.SeedAsync(app.Services);
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowFrontend");
app.UseSerilogRequestLogging();

// Global exception handler
app.UseMiddleware<ExceptionHandlingMiddleware>();

// Resolve tenant from request (before auth so auth can use tenant context)
app.UseMiddleware<TenantResolutionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();
