import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, Search, X } from 'lucide-react'
import { providersApi } from '@/api/endpoints/providers.api'
import type { ProviderSummary } from '@/types/provider.types'
import { useTenantStore } from '@/store/tenant.store'

function Avatar({ name, avatarUrl, size = 'md' }: { name: string; avatarUrl?: string; size?: 'md' | 'lg' }) {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const cls = size === 'lg' ? 'w-20 h-20 text-2xl rounded-2xl' : 'w-14 h-14 text-lg rounded-xl'
  return avatarUrl
    ? <img src={avatarUrl} alt={name} className={`${cls} object-cover flex-shrink-0`} />
    : (
      <div className={`${cls} flex items-center justify-center font-bold text-white flex-shrink-0`} style={{ background: 'var(--color-primary)' }}>
        {initials}
      </div>
    )
}

function ProviderCard({ provider }: { provider: ProviderSummary }) {
  const bio = provider.bio ? provider.bio.replace(/<[^>]*>/g, '').trim() : null

  return (
    <Link
      to={`/providers/${provider.id}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-[var(--color-primary)] transition-all duration-200 p-6 flex flex-col gap-5 min-h-[260px]"
    >
      {/* Top row: avatar + name + price */}
      <div className="flex items-center gap-4">
        <Avatar name={provider.fullName} avatarUrl={provider.avatarUrl} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-gray-900 group-hover:text-[var(--color-primary)] transition-colors leading-snug">
            {provider.fullName}
          </p>
          {provider.hourlyRate && (
            <p className="text-sm font-extrabold mt-1.5" style={{ color: 'var(--color-primary)' }}>
              ₺{provider.hourlyRate.toLocaleString('tr-TR')}
              <span className="text-xs font-normal text-gray-400"> /saat</span>
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {bio
        ? <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed flex-1">{bio}</p>
        : <div className="flex-1" />
      }

      {/* Tags + CTA */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 min-w-0">
          {provider.specializations.slice(0, 2).map((s) => (
            <span key={s} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
              {s}
            </span>
          ))}
          {provider.specializations.length > 2 && (
            <span className="text-xs px-3 py-1 rounded-full font-medium bg-gray-100 text-gray-500">
              +{provider.specializations.length - 2}
            </span>
          )}
        </div>
        <span className="flex-shrink-0 text-xs font-semibold px-4 py-2 rounded-xl text-white group-hover:opacity-90 transition-opacity" style={{ background: 'var(--color-primary)' }}>
          Profili Gör →
        </span>
      </div>
    </Link>
  )
}

export default function BrowseProvidersPage() {
  const slug = useTenantStore((s) => s.slug)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['providers', slug],
    queryFn: () => providersApi.search({ page: 1, pageSize: 50 }),
    enabled: !!slug,
  })

  const providers = data?.items ?? []

  // Tek öğretmen varsa direkt profile yönlendir
  if (!isLoading && providers.length === 1) {
    navigate(`/providers/${providers[0].id}`, { replace: true })
    return null
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return providers
    return providers.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.specializations.some((s) => s.toLowerCase().includes(q)) ||
        (p.bio ?? '').toLowerCase().includes(q),
    )
  }, [providers, search])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Öğretmenlerimiz</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isLoading ? 'Yükleniyor…' : `${providers.length} öğretmen`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="İsim veya konu ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:border-transparent shadow-sm"
          style={{ '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-[260px] bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-primary-light)' }}>
            <GraduationCap size={22} style={{ color: 'var(--color-primary)' }} />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            {search ? 'Aramanızla eşleşen öğretmen bulunamadı' : 'Henüz öğretmen eklenmedi'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="text-xs mt-2 font-medium" style={{ color: 'var(--color-primary)' }}>
              Aramayı temizle
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>
      )}
    </div>
  )
}
