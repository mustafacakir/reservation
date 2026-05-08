import { Link } from 'react-router-dom'
import type { SectorConfig } from '@/config/sectors'

interface HeroSectionProps {
  config: SectorConfig
  tenantName?: string | null
}

export default function HeroSection({ config }: HeroSectionProps) {
  const symbols = config.decorativeSymbols

  const positions = [
    { top: '8%', left: '4%', size: '5rem', rotate: '-15deg', opacity: 0.06 },
    { top: '15%', right: '6%', size: '6rem', rotate: '10deg', opacity: 0.06 },
    { bottom: '20%', left: '8%', size: '4.5rem', rotate: '20deg', opacity: 0.06 },
    { bottom: '10%', right: '10%', size: '5rem', rotate: '-10deg', opacity: 0.06 },
    { top: '40%', left: '2%', size: '3rem', rotate: '5deg', opacity: 0.05 },
    { top: '35%', right: '3%', size: '4rem', rotate: '-5deg', opacity: 0.05 },
  ]

  return (
    <section
      className="relative overflow-hidden py-24 px-4"
      style={{ background: `linear-gradient(135deg, var(--hero-gradient-from) 0%, var(--hero-gradient-to) 100%)` }}
    >
      {/* Decorative symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
        {positions.map((d, i) => (
          <span
            key={i}
            className="absolute font-black"
            style={{
              top: d.top, bottom: (d as any).bottom, left: (d as any).left, right: (d as any).right,
              fontSize: d.size, transform: `rotate(${d.rotate})`,
              opacity: d.opacity, color: 'var(--color-primary)',
              fontFamily: 'Georgia, serif',
            }}
          >
            {symbols[i % symbols.length]}
          </span>
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}
        >
          <span>{config.emoji}</span>
          <span>{config.label}</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
          {config.heroTitle}
        </h1>

        <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          {config.heroSubtitle}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link
            to="/providers"
            className="px-8 py-4 rounded-2xl text-base font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
            style={{ background: 'var(--color-primary)' }}
          >
            {config.browseLabel} →
          </Link>
          <a
            href="#nasil-calisir"
            className="px-8 py-4 rounded-2xl text-base font-semibold text-gray-700 bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all hover:scale-105"
          >
            Nasıl çalışır?
          </a>
        </div>

        {/* Trust bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
          {config.stats.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span>{s.icon}</span>
              <span className="font-bold text-gray-800">{s.value}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
