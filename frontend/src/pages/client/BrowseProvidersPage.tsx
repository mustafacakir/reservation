import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Star, GraduationCap } from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import type { ProviderSummary } from '@/types/provider.types'
import { useTenantStore } from '@/store/tenant.store'

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return avatarUrl
    ? <img src={avatarUrl} alt={name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
    : (
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-white text-2xl flex-shrink-0"
        style={{ background: 'var(--color-primary)' }}
      >
        {initials}
      </div>
    )
}

function ProviderCard({ provider }: { provider: ProviderSummary }) {
  const bioText = provider.bio ? provider.bio.replace(/<[^>]*>/g, '').trim() : null

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[var(--color-primary)] transition-all duration-200 p-6 flex gap-5"
    >
      <Avatar name={provider.fullName} avatarUrl={provider.avatarUrl} />

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-gray-900 text-base group-hover:text-[var(--color-primary)] transition-colors">
              {provider.fullName}
            </p>
            {provider.totalReviews > 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs font-semibold text-gray-700">{provider.averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({provider.totalReviews} yorum)</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 mt-0.5 block">Henüz yorum yok</span>
            )}
          </div>
          {provider.hourlyRate && (
            <div className="text-right flex-shrink-0">
              <p className="font-extrabold text-lg text-gray-900 leading-none">
                ₺{provider.hourlyRate.toLocaleString('tr-TR')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">/saat</p>
            </div>
          )}
        </div>

        {bioText && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{bioText}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex flex-wrap gap-1.5">
            {provider.specializations.slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-primary-light, #ede9fe)', color: 'var(--color-primary)' }}
              >
                {s}
              </span>
            ))}
            {provider.specializations.length > 4 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                +{provider.specializations.length - 4}
              </span>
            )}
          </div>
          <span
            className="flex-shrink-0 text-xs font-semibold px-4 py-1.5 rounded-xl text-white ml-3 group-hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-primary)' }}
          >
            Profili Gör →
          </span>
        </div>
      </div>
    </Link>
  )
}

export default function BrowseProvidersPage() {
  const slug = useTenantStore((s) => s.slug)

  const { data, isLoading } = useQuery({
    queryKey: ['providers', slug],
    queryFn: () => providersApi.search({ page: 1, pageSize: 50 }),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        {[0, 1].map((i) => (
          <div key={i} className="h-36 bg-white rounded-2xl border border-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  if ((data?.items.length ?? 0) === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center max-w-3xl mx-auto">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--color-primary-light, #ede9fe)' }}
        >
          <GraduationCap size={28} style={{ color: 'var(--color-primary)' }} />
        </div>
        <p className="font-semibold text-gray-700 mb-1">Henüz öğretmen eklenmedi</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="pb-2">
        <h1 className="text-2xl font-bold text-gray-900">Öğretmenlerimiz</h1>
        <p className="text-sm text-gray-500 mt-1">Alanında uzman öğretmenlerimizle ders rezervasyonu yapın</p>
      </div>
      {data?.items.map((p) => <ProviderCard key={p.id} provider={p} />)}
    </div>
  )
}
