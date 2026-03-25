import { apiClient } from '../client'
import type { Booking } from '@/types/booking.types'
import type { PagedResult } from '@/types/common.types'

export const bookingsApi = {
  create: (data: {
    serviceId: string
    providerId: string
    startUtc: string
    clientNotes?: string
  }) => apiClient.post<Booking>('/bookings', data).then((r) => r.data),

  getMyBookings: (page = 1, pageSize = 20) =>
    apiClient
      .get<PagedResult<Booking>>('/bookings', { params: { page, pageSize } })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Booking>(`/bookings/${id}`).then((r) => r.data),

  cancel: (id: string, reason?: string) =>
    apiClient.patch(`/bookings/${id}/cancel`, { reason }).then((r) => r.data),

  confirm: (id: string) =>
    apiClient.patch(`/bookings/${id}/confirm`).then((r) => r.data),

  complete: (id: string) =>
    apiClient.patch(`/bookings/${id}/complete`).then((r) => r.data),
}
