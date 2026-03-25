import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import type { ServiceItem } from '@/types/provider.types'

export default function MyServicesPage() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', durationMinutes: 60, price: 0, currency: 'USD' })

  const { data: services = [] } = useQuery<ServiceItem[]>({
    queryKey: ['myServices'],
    queryFn: () => apiClient.get('/services/me').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiClient.post('/services', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['myServices'] }); setShowForm(false) },
  })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          + Add Service
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">New Service</h2>
          <div className="space-y-3">
            {[
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'description', label: 'Description', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input type={type} value={form[key as keyof typeof form] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                <input type="number" value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input type="number" value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
              Save
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {services.map((s) => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900">{s.name}</p>
              <p className="text-sm text-gray-500">{s.durationMinutes} min · {s.description}</p>
            </div>
            <span className="font-semibold text-gray-900">{s.currency} {s.price}</span>
          </div>
        ))}
        {services.length === 0 && !showForm && (
          <p className="text-gray-500 text-center py-8">No services yet. Add your first service.</p>
        )}
      </div>
    </div>
  )
}
