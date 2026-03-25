import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { providersApi } from '@/api/endpoints/providers.api'
import { useAuthStore } from '@/store/auth.store'

export default function ProviderProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  const { data: provider, isLoading } = useQuery({
    queryKey: ['provider', id],
    queryFn: () => providersApi.getById(id!),
    enabled: !!id,
  })

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
  if (!provider) return <div className="text-center py-20 text-gray-500">Provider not found</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        {/* Profile header */}
        <div className="flex items-start gap-6 mb-6">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {provider.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{provider.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm font-medium">{provider.averageRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">({provider.totalReviews} reviews)</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {provider.specializations.map((s) => (
                <span key={s} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
          {provider.hourlyRate && (
            <div className="text-right">
              <span className="text-2xl font-bold text-gray-900">
                {provider.currency}{provider.hourlyRate}
              </span>
              <span className="text-sm text-gray-500">/hr</span>
            </div>
          )}
        </div>

        <p className="text-gray-700 mb-8">{provider.bio}</p>

        {/* Services */}
        <h2 className="font-bold text-gray-900 mb-3">Available Services</h2>
        <div className="space-y-3">
          {provider.services.map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors">
              <div>
                <p className="font-medium text-gray-900">{service.name}</p>
                <p className="text-sm text-gray-500">{service.durationMinutes} min · {service.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-gray-900">{service.currency}{service.price}</span>
                <button
                  onClick={() => {
                    if (!isAuthenticated) { navigate('/login'); return }
                    navigate(`/client/book/${provider.id}/${service.id}`)
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
