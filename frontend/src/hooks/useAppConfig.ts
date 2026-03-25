import { useEffect } from 'react'
import { useTenantStore } from '@/store/tenant.store'
import { tenantsApi } from '@/api/endpoints/tenants.api'
import { getSectorConfig } from '@/config/sectors'
import { useSectorTheme } from './useSectorTheme'

interface AppConfig {
  tenantSlug: string
  theme: string
}

let configLoaded = false

export function useAppConfig() {
  const { slug, settings, setTenant } = useTenantStore()
  const config = getSectorConfig(useTenantStore.getState().sector ?? undefined)

  useSectorTheme(config, settings?.primaryColor)

  useEffect(() => {
    if (configLoaded) return
    configLoaded = true

    fetch('/app.config.json')
      .then<AppConfig>((r) => r.json())
      .then((appConfig) => {
        // Set slug immediately so API interceptor picks it up
        useTenantStore.getState().setTenant(
          appConfig.tenantSlug,
          '', // name filled in after API call below
          appConfig.theme,
          useTenantStore.getState().settings ?? { currency: 'USD', timeZone: 'UTC', cancellationWindowHours: 24 },
        )

        // Fetch full tenant info from API
        return tenantsApi.getBySlug(appConfig.tenantSlug)
      })
      .then((tenant) => {
        setTenant(tenant.slug, tenant.name, tenant.sector, {
          currency: tenant.settings.currency,
          timeZone: tenant.settings.timeZone,
          primaryColor: tenant.settings.primaryColor,
          logoUrl: tenant.settings.logoUrl,
          cancellationWindowHours: tenant.settings.cancellationWindowHours,
        })
      })
      .catch((err) => {
        console.warn('[AppConfig] Could not load tenant config:', err)
      })
  }, [setTenant])
}
