import { apiClient } from '../client'

export interface TenantInfo {
  id: string
  name: string
  slug: string
  sector: string
  settings: {
    currency: string
    timeZone: string
    primaryColor?: string
    logoUrl?: string
    cancellationWindowHours: number
    customTagline?: string
    city?: string
    offersInPerson: boolean
    offersOnline: boolean
  }
}

export const tenantsApi = {
  getBySlug: (slug: string) =>
    apiClient.get<TenantInfo>(`/tenants/${slug}`).then((r) => r.data),
}
