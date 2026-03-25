export interface ProviderSummary {
  id: string
  userId: string
  fullName: string
  avatarUrl?: string
  bio: string
  specializations: string[]
  hourlyRate?: number
  currency: string
  averageRating: number
  totalReviews: number
  isAcceptingClients: boolean
}

export interface ProviderDetail extends ProviderSummary {
  services: ServiceItem[]
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
  currency: string
}
