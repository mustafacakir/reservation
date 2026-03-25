export type BookingStatus = 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'NoShow'

export interface Booking {
  id: string
  serviceId: string
  serviceName: string
  providerId: string
  providerName: string
  startUtc: string
  endUtc: string
  status: BookingStatus
  price: number
  currency: string
  clientName?: string
  clientNotes?: string
  providerNotes?: string
  cancellationReason?: string
}
