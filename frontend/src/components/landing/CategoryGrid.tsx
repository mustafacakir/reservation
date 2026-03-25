import { useNavigate } from 'react-router-dom'
import SectionWrapper from './SectionWrapper'
import type { CategoryItem } from '@/config/sectors'

interface CategoryGridProps {
  categories: CategoryItem[]
  providersLabel: string
}

export default function CategoryGrid({ categories, providersLabel }: CategoryGridProps) {
  const navigate = useNavigate()

  return (
    <SectionWrapper>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Browse by category</h2>
      <p className="text-gray-500 text-center mb-10">
        Find the right {providersLabel} for your specific needs
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => navigate(`/client/browse?category=${cat.slug}`)}
            className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:border-[var(--color-primary)] hover:shadow-md transition-all"
          >
            <span className="text-3xl group-hover:scale-110 transition-transform">{cat.icon}</span>
            <span className="text-sm font-medium text-gray-700 group-hover:text-[var(--color-primary)]">
              {cat.label}
            </span>
          </button>
        ))}
      </div>
    </SectionWrapper>
  )
}
