import { create } from 'zustand'

interface TenantSettings {
  currency: string
  timeZone: string
  primaryColor?: string
  logoUrl?: string
  cancellationWindowHours: number
}

interface TenantState {
  slug: string | null
  name: string | null
  sector: string | null
  settings: TenantSettings | null
  setTenant: (slug: string, name: string, sector: string, settings: TenantSettings) => void
  resolveFromHostname: () => void
}

function resolveSlugFromBrowser(): string | null {
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  // Works for: math-masters.localhost, math-masters.reservesaas.com
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
    return parts[0]
  }
  // Dev fallback: use VITE_DEV_TENANT_SLUG when running on plain localhost
  return import.meta.env.VITE_DEV_TENANT_SLUG ?? null
}

export const useTenantStore = create<TenantState>()((set) => ({
  // Resolve slug synchronously at store creation time so it's available
  // before the first render and any API calls.
  slug: resolveSlugFromBrowser(),
  name: null,
  sector: null,
  settings: null,

  setTenant: (slug, name, sector, settings) =>
    set({ slug, name, sector, settings }),

  resolveFromHostname: () => {
    const slug = resolveSlugFromBrowser()
    set({ slug })
  },
}))
