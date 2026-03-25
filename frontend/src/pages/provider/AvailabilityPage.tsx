import { useState } from 'react'
import { apiClient } from '@/api/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface DaySchedule {
  enabled: boolean
  startTime: string
  endTime: string
}

const defaultSchedule: Record<number, DaySchedule> = {
  0: { enabled: false, startTime: '09:00', endTime: '17:00' },
  1: { enabled: true, startTime: '09:00', endTime: '17:00' },
  2: { enabled: true, startTime: '09:00', endTime: '17:00' },
  3: { enabled: true, startTime: '09:00', endTime: '17:00' },
  4: { enabled: true, startTime: '09:00', endTime: '17:00' },
  5: { enabled: true, startTime: '09:00', endTime: '17:00' },
  6: { enabled: false, startTime: '09:00', endTime: '17:00' },
}

export default function AvailabilityPage() {
  const [schedule, setSchedule] = useState(defaultSchedule)
  const qc = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: (data: typeof schedule) =>
      apiClient.put('/availability/me/weekly', {
        slots: Object.entries(data)
          .filter(([, v]) => v.enabled)
          .map(([day, v]) => ({
            dayOfWeek: parseInt(day),
            startTime: v.startTime,
            endTime: v.endTime,
          })),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myAvailability'] }),
  })

  const toggle = (day: number) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], enabled: !s[day].enabled } }))

  const update = (day: number, field: 'startTime' | 'endTime', value: string) =>
    setSchedule((s) => ({ ...s, [day]: { ...s[day], [field]: value } }))

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weekly Availability</h1>
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        {DAYS.map((day, i) => (
          <div key={day} className="flex items-center gap-4">
            <button onClick={() => toggle(i)}
              className={`w-24 text-sm font-medium py-1.5 rounded-lg border transition-colors ${
                schedule[i].enabled
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {day.slice(0, 3)}
            </button>
            {schedule[i].enabled ? (
              <div className="flex items-center gap-2">
                <input type="time" value={schedule[i].startTime}
                  onChange={(e) => update(i, 'startTime', e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <span className="text-gray-400">—</span>
                <input type="time" value={schedule[i].endTime}
                  onChange={(e) => update(i, 'endTime', e.target.value)}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Unavailable</span>
            )}
          </div>
        ))}

        <div className="pt-4">
          <button onClick={() => saveMutation.mutate(schedule)}
            disabled={saveMutation.isPending}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors">
            {saveMutation.isPending ? 'Saving...' : 'Save Schedule'}
          </button>
          {saveMutation.isSuccess && (
            <span className="ml-3 text-sm text-green-600">Saved successfully!</span>
          )}
        </div>
      </div>
    </div>
  )
}
