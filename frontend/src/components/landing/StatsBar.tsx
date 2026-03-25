import type { SectorStats } from '@/config/sectors'

interface StatsBarProps {
  stats: SectorStats[]
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="bg-white border-y border-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex flex-wrap justify-center gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center min-w-[100px]">
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: 'var(--color-primary-light)' }}
              >
                {stat.icon}
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-none">
                {stat.value}
              </p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
 
