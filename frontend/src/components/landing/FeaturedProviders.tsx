import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import SectionWrapper from './SectionWrapper'
import ProviderCard, { type ProviderCardData } from './ProviderCard'
import { providersApi } from '@/api/endpoints/providers.api'
import type { ProviderSummary } from '@/types/provider.types'
import { useTenantStore } from '@/store/tenant.store'

interface FeaturedProvidersProps {
  providersLabel: string
  primaryColor?: string
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex justify-between mt-2">
          <div className="h-4 bg-gray-100 rounded w-1/4" />
          <div className="h-6 bg-gray-100 rounded-full w-16" />
        </div>
      </div>
    </div>
  )
}

export default function FeaturedProviders({ providersLabel, primaryColor }: FeaturedProvidersProps) {
  const { slug, settings } = useTenantStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['providers', 'featured', slug],
    queryFn: () => providersApi.search({ page: 1, pageSize: 6 }),
    staleTime: 1000 * 60 * 5,
    // Wait until tenant slug is available so X-Tenant-Slug header is included
    enabled: !!slug,
  })

  const providers: ProviderCardData[] = (data?.items ?? []).map((p: ProviderSummary) => ({
    id: p.id,
    fullName: p.fullName,
    title: p.specializations[0] ?? '',
    avatarUrl: p.avatarUrl,
    rating: p.averageRating,
    reviewCount: p.totalReviews,
    hourlyRate: p.hourlyRate ?? 0,
    currency: p.currency ?? settings?.currency ?? 'USD',
    specializations: p.specializations,
    slug: p.id,
  }))

  return (
    <SectionWrapper id="featured">
      <div className="mb-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Öğretmenlerimiz</h2>
        <p className="text-gray-500">Alanında uzman, seçkin matematik öğretmenlerimizle tanışın</p>
      </div>

      {isError ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">😕</p>
          <p>Öğretmenler şu an yüklenemedi. Lütfen daha sonra tekrar deneyin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
            : providers.map((p) => (
                <ProviderCard key={p.id} provider={p} primaryColor={primaryColor} />
              ))}
        </div>
      )}

    </SectionWrapper>
  )
}
