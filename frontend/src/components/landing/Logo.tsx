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

  return (
    <span className={`font-extrabold tracking-tight ${sizeClass} ${className}`} style={{ color }}>
      {displayName}
    </span>
  )
}
