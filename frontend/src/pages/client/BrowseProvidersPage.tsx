import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, X, Star, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import type { ProviderSummary } from '@/types/provider.types'
import { useTenantStore } from '@/store/tenant.store'

const QUICK_FILTERS = ['DGS', 'KPSS', 'YKS / AYT', 'İlkokul', 'Ortaokul', 'Lise']

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return avatarUrl
    ? <img src={avatarUrl} alt={name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
    : (
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-white text-lg flex-shrink-0"
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
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[var(--color-primary)] transition-all duration-200 overflow-hidden flex flex-col"
    >
      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Avatar + info */}
        <div className="flex items-center gap-3">
          <Avatar name={provider.fullName} avatarUrl={provider.avatarUrl} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
              {provider.fullName}
            </p>
            {provider.totalReviews > 0 ? (
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={11} className="text-amber-400 fill-amber-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-gray-700">{provider.averageRating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({provider.totalReviews})</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 mt-0.5 block">Henüz yorum yok</span>
            )}
          </div>
          {provider.hourlyRate && (
            <div className="text-right flex-shrink-0">
              <p className="font-extrabold text-base text-gray-900 leading-none">
                ₺{provider.hourlyRate.toLocaleString('tr-TR')}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">/saat</p>
            </div>
          )}
        </div>

        {/* Bio */}
        {bioText && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{bioText}</p>
        )}

        {/* Tags */}
        {provider.specializations.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {provider.specializations.slice(0, 3).map((s) => (
              <span
                key={s}
                className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
                style={{ background: 'var(--color-primary-light, #ede9fe)', color: 'var(--color-primary)' }}
              >
                {s}
              </span>
            ))}
            {provider.specializations.length > 3 && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                +{provider.specializations.length - 3}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto">
          <div
            className="w-full py-2 rounded-xl text-xs font-semibold text-white text-center group-hover:opacity-90 transition-opacity"
            style={{ background: 'var(--color-primary)' }}
          >
            Profili Gör →
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function BrowseProvidersPage() {
  const slug = useTenantStore((s) => s.slug)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const effectiveSearch = activeFilter ?? (search || undefined)

  const { data, isLoading } = useQuery({
    queryKey: ['providers', effectiveSearch, page],
    queryFn: () => providersApi.search({ specialization: effectiveSearch, page, pageSize: 12 }),
    enabled: !!slug,
  })

  const handleSearch = (val: string) => {
    setSearch(val)
    setActiveFilter(null)
    setPage(1)
  }

  const handleFilter = (f: string) => {
    setActiveFilter((prev) => (prev === f ? null : f))
    setSearch('')
    setPage(1)
  }

  return (
    <div className="w-full space-y-5">

      {/* Top bar: search + filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Konu ara…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-9 pr-8 py-2.5 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
          />
          {search && (
            <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          {QUICK_FILTERS.map((f) => {
            const active = activeFilter === f
            return (
              <button
                key={f}
                onClick={() => handleFilter(f)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition-all ${
                  active
                    ? 'text-white border-transparent shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={active ? { background: 'var(--color-primary)' } : {}}
              >
                {f}
              </button>
            )
          })}
          {(search || activeFilter) && (
            <button
              onClick={() => { setSearch(''); setActiveFilter(null); setPage(1) }}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 px-2"
            >
              <X size={11} /> Temizle
            </button>
          )}
        </div>
      </div>

      {/* Result info */}
      {!isLoading && data && (
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-800">{data.totalCount}</span> öğretmen bulundu
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (data?.items.length ?? 0) === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--color-primary-light, #ede9fe)' }}
          >
            <GraduationCap size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Öğretmen bulunamadı</p>
          <p className="text-sm text-gray-400">Farklı bir konu veya filtre deneyin.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.items.map((p) => <ProviderCard key={p.id} provider={p} />)}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pb-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                    p === page ? 'text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                  style={p === page ? { background: 'var(--color-primary)' } : {}}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
