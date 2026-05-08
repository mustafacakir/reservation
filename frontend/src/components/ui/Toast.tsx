import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (message: string, opts?: { description?: string; variant?: ToastVariant }) => void
  success: (message: string, description?: string) => void
  error: (message: string, description?: string) => void
  info: (message: string, description?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let _id = 0

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof CheckCircle; bg: string; border: string; icon_color: string; title_color: string }> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-white',
    border: 'border-emerald-200',
    icon_color: 'text-emerald-500',
    title_color: 'text-gray-900',
  },
  error: {
    icon: XCircle,
    bg: 'bg-white',
    border: 'border-red-200',
    icon_color: 'text-red-500',
    title_color: 'text-gray-900',
  },
  info: {
    icon: Info,
    bg: 'bg-white',
    border: 'border-blue-200',
    icon_color: 'text-blue-500',
    title_color: 'text-gray-900',
  },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    // mount → visible (slide in)
    const frame = requestAnimationFrame(() => setVisible(true))

    timerRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onRemove(toast.id), 300)
    }, 4000)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timerRef.current)
    }
  }, [toast.id, onRemove])

  const dismiss = () => {
    clearTimeout(timerRef.current)
    setVisible(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const { icon: Icon, bg, border, icon_color, title_color } = VARIANT_STYLES[toast.variant]

  return (
    <div
      className={`flex items-start gap-3 ${bg} border ${border} rounded-2xl shadow-lg px-4 py-3.5 min-w-[280px] max-w-sm transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <Icon size={18} className={`${icon_color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${title_color} leading-snug`}>{toast.message}</p>
        {toast.description && (
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{toast.description}</p>
        )}
      </div>
      <button
        onClick={dismiss}
        className="p-0.5 rounded-lg text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((message: string, variant: ToastVariant, description?: string) => {
    const id = ++_id
    setToasts((prev) => [...prev.slice(-4), { id, message, description, variant }])
  }, [])

  const ctx: ToastContextValue = {
    toast: (message, opts) => add(message, opts?.variant ?? 'info', opts?.description),
    success: (message, description) => add(message, 'success', description),
    error: (message, description) => add(message, 'error', description),
    info: (message, description) => add(message, 'info', description),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
