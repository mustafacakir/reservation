import { Mail, MapPin, Globe, Phone } from 'lucide-react'
import { useTenantStore } from '@/store/tenant.store'

export default function IletisimPage() {
  const { settings, name } = useTenantStore()

  const items = [
    settings?.contactEmail && {
      icon: <Mail size={18} style={{ color: 'var(--color-primary)' }} />,
      label: 'E-posta',
      value: settings.contactEmail,
      sub: 'En geç 2 iş günü içinde yanıt',
      href: `mailto:${settings.contactEmail}`,
    },
    settings?.contactPhone && {
      icon: <Phone size={18} style={{ color: 'var(--color-primary)' }} />,
      label: 'Telefon',
      value: settings.contactPhone,
      href: `tel:${settings.contactPhone.replace(/\s/g, '')}`,
    },
    settings?.address && {
      icon: <MapPin size={18} style={{ color: 'var(--color-primary)' }} />,
      label: 'Adres',
      value: settings.address,
    },
    (settings?.websiteUrl || settings?.taxNumber) && {
      icon: <Globe size={18} style={{ color: 'var(--color-primary)' }} />,
      label: 'Web Sitesi',
      value: settings.websiteUrl ?? '',
      sub: settings.taxNumber ? `Vergi No: ${settings.taxNumber}` : undefined,
    },
  ].filter(Boolean) as {
    icon: React.ReactNode
    label: string
    value: string
    sub?: string
    href?: string
  }[]

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">İletişim</h1>
      <p className="text-sm text-gray-400 mb-10">
        {name ? `${name} ile` : 'Bizimle'} iletişime geçin.
      </p>

      {items.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-6">
          {items.map((item) => {
            const inner = (
              <div className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-2xl h-full transition-all hover:border-[var(--color-primary)] hover:shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{item.label}</p>
                  <p className="text-sm text-gray-500 mt-0.5 break-all">{item.value}</p>
                  {item.sub && <p className="text-xs text-gray-400 mt-1">{item.sub}</p>}
                </div>
              </div>
            )
            return item.href
              ? <a key={item.label} href={item.href}>{inner}</a>
              : <div key={item.label}>{inner}</div>
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400 text-sm">
          İletişim bilgileri henüz girilmemiş.
        </div>
      )}
    </div>
  )
}
