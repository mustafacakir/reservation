import { useTenantStore } from '@/store/tenant.store'
import { getSectorConfig } from '@/config/sectors'
import { useSectorTheme } from '@/hooks/useSectorTheme'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorks from '@/components/landing/HowItWorks'
import WhyUs from '@/components/landing/WhyUs'
import FAQ from '@/components/landing/FAQ'
import Footer from '@/components/landing/Footer'

export default function LandingPage() {
  const { name, sector, settings } = useTenantStore()
  const config = getSectorConfig(sector)

  useSectorTheme(config, settings?.primaryColor)

  return (
    <div className="min-h-screen bg-white">
      <HeroSection config={config} tenantName={name} />
      <HowItWorks steps={config.howItWorks} />
      <WhyUs />
      <FAQ />
      <Footer />
    </div>
  )
}
