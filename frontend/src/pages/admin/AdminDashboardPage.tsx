export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['Total Users', 'Active Bookings', 'Total Revenue'].map((label) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">—</p>
          </div>
        ))}
      </div>
    </div>
  )
}
