import { Link } from 'react-router-dom'

interface ProviderCtaProps {
  title: string
  subtitle: string
}

export default function ProviderCta({ title, subtitle }: ProviderCtaProps) {
  return (
    <div
      className="py-16 px-4 text-center text-white"
      style={{ background: 'var(--color-primary)' }}
    >
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">{title}</h2>
        <p className="text-white/80 mb-8">{subtitle}</p>
        <Link
          to="/register?role=provider"
          className="inline-block bg-white font-semibold px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
          style={{ color: 'var(--color-primary)' }}
        >
          Öğretmen olarak katıl
        </Link>
      </div>
    </div>
  )
}
