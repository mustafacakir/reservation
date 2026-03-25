import { useQuery } from '@tanstack/react-query'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import { format } from 'date-fns'
import type { Booking } from '@/types/booking.types'

export default function ProviderDashboard() {
  const { data } = useQuery({
    queryKey: ['providerBookings'],
    queryFn: () => bookingsApi.getMyBookings(1, 10),
  })

  const upcoming = data?.items.filter(
    (b) => (b.status === 'Pending' || b.status === 'Confirmed') && new Date(b.startUtc) > new Date()
  ) ?? []

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Upcoming Sessions', value: upcoming.length },
          { label: 'Total Bookings', value: data?.totalCount ?? 0 },
          { label: 'Pending Requests', value: data?.items.filter(b => b.status === 'Pending').length ?? 0 },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="font-semibold text-gray-800 mb-3">Upcoming Sessions</h2>
      {upcoming.length === 0 ? (
        <p className="text-gray-500">No upcoming sessions.</p>
      ) : (
        <div className="space-y-3">
          {upcoming.slice(0, 5).map((b: Booking) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="font-medium text-gray-900">{b.serviceName}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {format(new Date(b.startUtc), 'EEE, MMM d · HH:mm')}
              </p>
              <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                b.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>{b.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
