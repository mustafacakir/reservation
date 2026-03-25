import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'
import { providersApi } from '@/api/endpoints/providers.api'
import { bookingsApi } from '@/api/endpoints/bookings.api'
import type { AvailableSlot } from '@/types/availability.types'

export default function BookingFlowPage() {
  const { providerId, serviceId } = useParams<{ providerId: string; serviceId: string }>()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [clientNotes, setClientNotes] = useState('')

  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ['slots', providerId, serviceId, dateStr],
    queryFn: () => providersApi.getAvailableSlots(providerId!, serviceId!, dateStr),
    enabled: !!providerId && !!serviceId,
  })

  const bookMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => navigate('/client/bookings'),
  })

  const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i))

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Select a time slot</h1>

      {/* Date picker */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Select date</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dates.map((date) => {
            const isSelected = format(date, 'yyyy-MM-dd') === dateStr
            return (
              <button key={date.toISOString()} onClick={() => { setSelectedDate(date); setSelectedSlot(null) }}
                className={`shrink-0 flex flex-col items-center px-3 py-2 rounded-xl border transition-colors ${
                  isSelected ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                }`}>
                <span className="text-xs">{format(date, 'EEE')}</span>
                <span className="text-lg font-bold">{format(date, 'd')}</span>
                <span className="text-xs">{format(date, 'MMM')}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Time slots */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h2 className="font-semibold text-gray-800 mb-3">Available times</h2>
        {loadingSlots ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600" />
          </div>
        ) : slots?.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No available slots on this date.</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots?.map((slot) => (
              <button key={slot.startUtc}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  selectedSlot?.startUtc === slot.startUtc
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-200 text-gray-700 hover:border-indigo-300'
                }`}>
                {slot.startLocal}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm */}
      {selectedSlot && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Confirm booking</h2>
          <p className="text-gray-700 mb-4">
            {format(selectedDate, 'EEEE, MMMM d')} at <strong>{selectedSlot.startLocal}</strong>
          </p>
          <textarea value={clientNotes} onChange={(e) => setClientNotes(e.target.value)}
            placeholder="Notes for your provider (optional)"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3} />
          <button
            onClick={() => bookMutation.mutate({
              serviceId: serviceId!,
              providerId: providerId!,
              startUtc: selectedSlot.startUtc,
              clientNotes: clientNotes || undefined,
            })}
            disabled={bookMutation.isPending}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      )}
    </div>
  )
}
