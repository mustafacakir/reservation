import { useEffect } from 'react'
import type { SectorConfig } from '@/config/sectors'

/**
 * Applies CSS variables from the sector config (sectors.ts) to the document root.
 * If the tenant API provides a custom primaryColor, it overrides the sector default.
 */
export function useSectorTheme(config: SectorConfig, tenantPrimaryColor?: string | null) {
  useEffect(() => {
    const root = document.documentElement
    const { cssVars } = config

    // Tenant-specific override takes precedence over sector default
    const primary = tenantPrimaryColor ?? cssVars.primary

    root.style.setProperty('--color-primary', primary)
    root.style.setProperty('--color-primary-dark', cssVars.primaryDark)
    root.style.setProperty('--color-primary-light', cssVars.primaryLight)
    root.style.setProperty('--color-accent', cssVars.accent)
    root.style.setProperty('--hero-gradient-from', cssVars.heroGradientFrom)
    root.style.setProperty('--hero-gradient-to', cssVars.heroGradientTo)
  }, [config, tenantPrimaryColor])
}
