import { useTenantStore } from '@/store/tenant.store'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  white?: boolean
}

export default function Logo({ size = 'md', className = '', white = false }: LogoProps) {
  const { name, slug } = useTenantStore()
  const displayName = name || slug || 'Randevu'

  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl'
  const color = white ? '#fff' : 'var(--color-primary)'
  const darkColor = white ? 'rgba(255,255,255,0.85)' : 'var(--color-primary-dark)'

  const hasSuperscript = displayName.endsWith('²')
  const baseName = hasSuperscript ? displayName.slice(0, -1) : displayName

  return (
    <span className={`font-extrabold tracking-tight ${sizeClass} ${className}`} style={{ color }}>
      {baseName}
      {hasSuperscript && (
        <sup style={{ fontSize: '0.45em', letterSpacing: 0, fontStyle: 'normal', color: darkColor, opacity: 0.85 }}>²</sup>
      )}
    </span>
  )
}
