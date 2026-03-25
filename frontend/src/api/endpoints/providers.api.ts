import { apiClient } from '../client'
import type { ProviderSummary, ProviderDetail } from '@/types/provider.types'
import type { AvailableSlot } from '@/types/availability.types'
import type { PagedResult } from '@/types/common.types'

export const providersApi = {
  search: (params: {
    specialization?: string
    maxRate?: number
    isAccepting?: boolean
    page?: number
    pageSize?: number
  }) =>
    apiClient
      .get<PagedResult<ProviderSummary>>('/providers', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ProviderDetail>(`/providers/${id}`).then((r) => r.data),

  getAvailableSlots: (providerId: string, serviceId: string, date: string) =>
    apiClient
      .get<AvailableSlot[]>(`/providers/${providerId}/available-slots`, {
        params: { serviceId, date },
      })
      .then((r) => r.data),

  updateMyProfile: (data: {
    bio: string
    specializations: string[]
    hourlyRate?: number
    currency: string
  }) => apiClient.put('/providers/me', data).then((r) => r.data),
}
