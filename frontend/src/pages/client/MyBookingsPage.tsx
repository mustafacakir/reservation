import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import type { Booking, BookingStatus } from '@/types/booking.types'

const statusColors: Record<BookingStatus, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Confirmed: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  Completed: 'bg-blue-100 text-blue-800',
  NoShow: 'bg-gray-100 text-gray-800',
}

function BookingRow({ booking }: { booking: Booking }) {
  const qc = useQueryClient()
  const cancelMutation = useMutation({
    mutationFn: () => bookingsApi.cancel(booking.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myBookings'] }),
  })

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between">
      <div>
        <p className="font-semibold text-gray-900">{booking.serviceName}</p>
        <p className="text-sm text-gray-600">with {booking.providerName}</p>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(booking.startUtc), 'EEE, MMM d · HH:mm')}
        </p>
        <p className="font-medium text-gray-800 mt-1">
          {booking.currency} {booking.price}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[booking.status]}`}>
          {booking.status}
        </span>
        {(booking.status === 'Pending' || booking.status === 'Confirmed') && (
          <button onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50">
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}

export default function MyBookingsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingsApi.getMyBookings(),
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">No bookings yet.</div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((b) => <BookingRow key={b.id} booking={b} />)}
        </div>
      )}
    </div>
  )
}
