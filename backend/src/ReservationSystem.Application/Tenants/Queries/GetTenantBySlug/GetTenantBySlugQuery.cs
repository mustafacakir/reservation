using MediatR;
using Microsoft.EntityFrameworkCore;
using ReservationSystem.Application.Common.Exceptions;
using ReservationSystem.Application.Common.Interfaces;

namespace ReservationSystem.Application.Tenants.Queries.GetTenantBySlug;

public record GetTenantBySlugQuery(string Slug) : IRequest<TenantDto>;

public record TenantDto(
    Guid Id,
    string Name,
    string Slug,
    string Sector,
    TenantSettingsDto Settings);

public record TenantSettingsDto(
    string Currency,
    string TimeZone,
    string? PrimaryColor,
    string? LogoUrl,
    int CancellationWindowHours);

public class GetTenantBySlugQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetTenantBySlugQuery, TenantDto>
{
    public async Task<TenantDto> Handle(GetTenantBySlugQuery request, CancellationToken cancellationToken)
    {
        var tenant = await db.Tenants
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => t.Slug == request.Slug && t.IsActive, cancellationToken)
            ?? throw new NotFoundException("Tenant", request.Slug);

        return new TenantDto(
            tenant.Id,
            tenant.Name,
            tenant.Slug,
            tenant.Sector,
            new TenantSettingsDto(
                tenant.Settings.Currency,
                tenant.Settings.TimeZone,
                tenant.Settings.PrimaryColor,
                tenant.Settings.LogoUrl,
                tenant.Settings.CancellationWindowHours));
    }
}
