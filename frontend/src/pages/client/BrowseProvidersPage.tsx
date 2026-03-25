import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { providersApi } from '@/api/endpoints/providers.api'
import { Link } from 'react-router-dom'
import type { ProviderSummary } from '@/types/provider.types'

function ProviderCard({ provider }: { provider: ProviderSummary }) {
  return (
    <Link to={`/providers/${provider.id}`}
      className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-indigo-200 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-lg font-bold text-indigo-600 shrink-0">
          {provider.fullName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{provider.fullName}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-yellow-500 text-sm">★</span>
            <span className="text-sm text-gray-700">{provider.averageRating.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({provider.totalReviews})</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {provider.specializations.slice(0, 3).map((s) => (
              <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{provider.bio}</p>
        </div>
      </div>
      {provider.hourlyRate && (
        <div className="mt-3 text-right">
          <span className="font-semibold text-gray-900">{provider.currency} {provider.hourlyRate}</span>
          <span className="text-sm text-gray-500"> /hr</span>
        </div>
      )}
      {!provider.isAcceptingClients && (
        <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full text-center">
          Not accepting new clients
        </div>
      )}
    </Link>
  )
}

export default function BrowseProvidersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['providers', search, page],
    queryFn: () => providersApi.search({ specialization: search || undefined, page, pageSize: 12 }),
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Browse Providers</h1>
        <p className="text-gray-600 mt-1">Find the right professional for you</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by specialization..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full max-w-sm border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.items.map((provider) => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <span className="px-4 py-2 text-sm text-gray-700">{page} / {data.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= data.totalPages}
                className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          )}

          {data?.items.length === 0 && (
            <div className="text-center py-20 text-gray-500">No providers found.</div>
          )}
        </>
      )}
    </div>
  )
}
