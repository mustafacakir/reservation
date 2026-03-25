import { Link } from 'react-router-dom'
import { useTenantStore } from '@/store/tenant.store'

export default function LandingPage() {
  const { name, sector } = useTenantStore()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 to-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            {name ? `Welcome to ${name}` : 'Find your perfect session'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {sector === 'tutoring'
              ? 'Connect with expert tutors, see their availability, and book instantly.'
              : sector === 'psychology'
              ? 'Find a licensed therapist and schedule your first session today.'
              : 'Browse professionals, check availability, and book in seconds.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/client/browse"
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
              Browse Providers
            </Link>
            <Link to="/register"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
              Sign up free
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🔍', title: 'Browse & Filter', desc: 'Find providers by specialization, rating, price, and availability.' },
            { icon: '📅', title: 'Instant Booking', desc: 'See real-time availability and book your session in seconds.' },
            { icon: '⭐', title: 'Verified Reviews', desc: 'Read authentic reviews from verified clients before booking.' },
          ].map((f) => (
            <div key={f.title} className="text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
