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
  instagramUrl: string | null
  linkedInUrl: string | null
  youtubeUrl: string | null
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  durationMinutes: number
  price: number
  currency: string
  sessionType: 'Individual' | 'Group'
  maxParticipants: number | null
  recurrenceWeeks: number | null
  scheduledStart: string | null
  scheduledEnd: string | null
  zoomLink: string | null
  zoomMeetingId: string | null
  zoomPassword: string | null
  seriesId: string | null
}
