import SectionWrapper from './SectionWrapper'
import StarRating from './StarRating'
import type { TestimonialItem } from '@/config/sectors'

interface TestimonialsProps {
  testimonials: TestimonialItem[]
}

export default function Testimonials({ testimonials }: TestimonialsProps) {
  return (
    <SectionWrapper className="bg-gray-50">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Öğrenciler ne diyor?</h2>
      <p className="text-gray-500 text-center mb-10">Gerçek öğrencilerden doğrulanmış yorumlar</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col gap-4">
            <StarRating rating={t.rating} />
            <p className="text-gray-700 text-sm leading-relaxed flex-1">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'var(--color-primary)' }}
              >
                {t.avatar}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
