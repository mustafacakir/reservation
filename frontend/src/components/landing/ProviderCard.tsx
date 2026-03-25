import { Link } from 'react-router-dom'
import StarRating from './StarRating'

export interface ProviderCardData {
  id: string
  fullName: string
  title: string
  avatarUrl?: string
  rating: number
  reviewCount: number
  hourlyRate: number
  currency: string
  specializations: string[]
  slug: string
}

interface ProviderCardProps {
  provider: ProviderCardData
  primaryColor?: string
}

export default function ProviderCard({ provider, primaryColor = '#4f46e5' }: ProviderCardProps) {
  const initials = provider.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <Link
      to={`/providers/${provider.slug}`}
      className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Avatar */}
      <div className="h-36 flex items-center justify-center" style={{ background: `${primaryColor}15` }}>
        {provider.avatarUrl ? (
          <img src={provider.avatarUrl} alt={provider.fullName} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white"
            style={{ background: primaryColor }}
          >
            {initials}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors truncate">
          {provider.fullName}
        </h3>
        <p className="text-sm text-gray-500 mb-2 truncate">{provider.title}</p>

        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={Math.round(provider.rating)} />
          <span className="text-xs text-gray-500">
            {provider.rating.toFixed(1)} ({provider.reviewCount})
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {provider.specializations.slice(0, 2).map((s) => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {s}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            {provider.currency} {provider.hourlyRate}
            <span className="font-normal text-gray-500"> / saat</span>
          </span>
          <span
            className="text-xs font-medium px-3 py-1 rounded-full text-white"
            style={{ background: primaryColor }}
          >
            Rezerve Et
          </span>
        </div>
      </div>
    </Link>
  )
}
