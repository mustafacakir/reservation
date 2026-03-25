using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using ReservationSystem.Application.Common.Interfaces;
using ReservationSystem.Domain.Entities;
using System.Text.Json;

namespace ReservationSystem.Infrastructure.Tenancy;

public class TenantService(
    ILogger<TenantService> logger,
    IDistributedCache cache) : ITenantService
{
    private Guid? _currentTenantId;
    private string? _currentTenantSlug;

    public Guid? CurrentTenantId => _currentTenantId;
    public string? CurrentTenantSlug => _currentTenantSlug;

    public void SetCurrentTenant(Guid tenantId, string slug)
    {
        _currentTenantId = tenantId;
        _currentTenantSlug = slug;
    }

    public async Task<Tenant?> GetCurrentTenantAsync(CancellationToken ct = default)
    {
        if (_currentTenantSlug == null) return null;
        return await GetBySlugAsync(_currentTenantSlug, ct);
    }

    public async Task<Tenant?> GetBySlugAsync(string slug, CancellationToken ct = default)
    {
        var cacheKey = $"tenant:{slug}";
        var cached = await cache.GetStringAsync(cacheKey, ct);

        if (cached != null)
        {
            return JsonSerializer.Deserialize<TenantCacheDto>(cached) is { } dto
                ? TenantFromDto(dto) : null;
        }

        return null; // DbContext lookup happens in middleware via injected context
    }

    private static Tenant TenantFromDto(TenantCacheDto dto)
    {
        // Reconstruct a minimal tenant from cache for settings access
        var tenant = Tenant.Create(dto.Name, dto.Slug, dto.Sector, dto.PlanTier);
        tenant.UpdateSettings(new TenantSettings
        {
            CancellationWindowHours = dto.CancellationWindowHours,
            Currency = dto.Currency,
            TimeZone = dto.TimeZone
        });
        return tenant;
    }

    private record TenantCacheDto(
        Guid Id, string Name, string Slug, string Sector,
        Domain.Enums.PlanTier PlanTier,
        int CancellationWindowHours, string Currency, string TimeZone);
}
