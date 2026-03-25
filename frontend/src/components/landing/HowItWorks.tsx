import SectionWrapper from './SectionWrapper'
import type { HowItWorksStep } from '@/config/sectors'

interface HowItWorksProps {
  steps: HowItWorksStep[]
}

export default function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <SectionWrapper id="nasil-calisir" className="bg-gray-50">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center">Nasıl çalışır?</h2>
      <p className="text-gray-500 text-center mb-12">Dört adımda başla</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-col items-center text-center relative">
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="hidden lg:block absolute top-7 left-1/2 w-full h-0.5 bg-gray-200" style={{ left: '75%' }} />
            )}

            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl mb-4 relative z-10"
              style={{ background: 'var(--color-primary-light)' }}
            >
              {step.icon}
            </div>

            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {i + 1}
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
            <p className="text-sm text-gray-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
