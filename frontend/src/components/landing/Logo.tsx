interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  white?: boolean
}

export default function Logo({ size = 'md', className = '', white = false }: LogoProps) {
  const sizeClass = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-base' : 'text-xl'
  const color = white ? '#fff' : 'var(--color-primary)'
  const darkColor = white ? 'rgba(255,255,255,0.85)' : 'var(--color-primary-dark)'
  return (
    <span className={`font-extrabold tracking-tight ${sizeClass} ${className}`} style={{ color }}>
      sevdaile
      <span style={{ fontStyle: 'italic', color }}>ma</span>
      <span style={{ color: darkColor, fontStyle: 'italic' }}>te</span>
      matik
      <sup style={{ fontSize: '0.45em', letterSpacing: 0, fontStyle: 'normal', opacity: 0.75 }}>²</sup>
    </span>
  )
}
