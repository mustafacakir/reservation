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

export const useTenantStore = create<TenantState>()((set) => ({
  slug: null,
  name: null,
  sector: null,
  settings: null,

  setTenant: (slug, name, sector, settings) =>
    set({ slug, name, sector, settings }),

  resolveFromHostname: () => {
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'app') {
      set({ slug: parts[0] })
    } else {
      // For local dev: use query param ?tenant=math-masters
      const params = new URLSearchParams(window.location.search)
      const tenant = params.get('tenant')
      if (tenant) set({ slug: tenant })
    }
  },
}))
