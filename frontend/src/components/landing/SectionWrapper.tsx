interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
}

export default function SectionWrapper({ children, className = '', id }: SectionWrapperProps) {
  return (
    <section id={id} className={`py-16 px-4 ${className}`}>
      <div className="max-w-6xl mx-auto">{children}</div>
    </section>
  )
}
