import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, Terminal, X } from 'lucide-react'

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'hud'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
  timestamp: number
}

export interface ToastOptions {
  id?: string
  title?: string
  duration?: number
  type?: ToastType
}

export interface ToastContextType {
  toasts: ToastItem[]
  addToast: (message: string, options?: ToastOptions) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  toast: {
    info: (message: string, options?: Omit<ToastOptions, 'type'>) => string
    success: (message: string, options?: Omit<ToastOptions, 'type'>) => string
    warning: (message: string, options?: Omit<ToastOptions, 'type'>) => string
    error: (message: string, options?: Omit<ToastOptions, 'type'>) => string
    hud: (message: string, options?: Omit<ToastOptions, 'type'>) => string
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const DEFAULT_DURATION = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  const addToast = useCallback(
    (message: string, options: ToastOptions = {}): string => {
      const id = options.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const type = options.type || 'info'
      const duration = options.duration ?? DEFAULT_DURATION
      const timestamp = Date.now()

      const newToast: ToastItem = {
        id,
        title: options.title,
        message,
        type,
        duration,
        timestamp,
      }

      setToasts((prev) => [newToast, ...prev].slice(0, 8)) // Keep max 8 active toasts

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }

      return id
    },
    [removeToast]
  )

  const toastHelpers = {
    info: useCallback(
      (message: string, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'info' }),
      [addToast]
    ),
    success: useCallback(
      (message: string, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'success' }),
      [addToast]
    ),
    warning: useCallback(
      (message: string, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'warning' }),
      [addToast]
    ),
    error: useCallback(
      (message: string, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'error' }),
      [addToast]
    ),
    hud: useCallback(
      (message: string, options?: Omit<ToastOptions, 'type'>) =>
        addToast(message, { ...options, type: 'hud' }),
      [addToast]
    ),
  }

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        clearToasts,
        toast: toastHelpers,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || toasts.length === 0) {
    return null
  }

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-md w-full px-4 sm:px-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItemCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItemCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: string) => void
}) {
  const styles = getToastStyles(toast.type)

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded border chitin-card shadow-2xl transition-all duration-300 transform translate-y-0 ${styles.borderClass} ${styles.bgClass}`}
      role="alert"
    >
      <div className={`mt-0.5 shrink-0 ${styles.iconColor}`}>
        {styles.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-mono tracking-widest uppercase px-1.5 py-0.5 rounded border ${styles.badgeClass}`}>
            {styles.label}
          </span>
          {toast.title && (
            <span className="text-xs font-semibold text-[#dfe3e3] truncate">
              {toast.title}
            </span>
          )}
        </div>
        <p className="text-xs text-[#b0c0c0] font-mono leading-relaxed break-words">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 text-[#607070] hover:text-[#00c3ff] transition-colors p-1 rounded hover:bg-[#ffffff]/5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function getToastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return {
        label: 'ASCENSION CONFIRMED',
        icon: <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />,
        borderClass: 'border-[#00ff88]/40 shadow-[0_0_15px_rgba(0,255,136,0.15)]',
        bgClass: 'bg-[#051510]/90',
        badgeClass: 'bg-[#00ff88]/15 border-[#00ff88]/30 text-[#00ff88]',
        iconColor: 'text-[#00ff88]',
      }
    case 'warning':
      return {
        label: 'WARNING DETECTED',
        icon: <AlertTriangle className="w-4 h-4 text-[#ffb700]" />,
        borderClass: 'border-[#ffb700]/40 shadow-[0_0_15px_rgba(255,183,0,0.15)]',
        bgClass: 'bg-[#181305]/90',
        badgeClass: 'bg-[#ffb700]/15 border-[#ffb700]/30 text-[#ffb700]',
        iconColor: 'text-[#ffb700]',
      }
    case 'error':
      return {
        label: 'ANOMALY ALERT',
        icon: <ShieldAlert className="w-4 h-4 text-[#ff453a]" />,
        borderClass: 'border-[#ff453a]/50 shadow-[0_0_15px_rgba(255,69,58,0.2)]',
        bgClass: 'bg-[#1c0808]/90',
        badgeClass: 'bg-[#ff453a]/15 border-[#ff453a]/40 text-[#ff453a]',
        iconColor: 'text-[#ff453a]',
      }
    case 'hud':
      return {
        label: 'NEURAL SIGNAL',
        icon: <Terminal className="w-4 h-4 text-[#ff0055]" />,
        borderClass: 'border-[#ff0055]/50 shadow-[0_0_15px_rgba(255,0,85,0.2)]',
        bgClass: 'bg-[#18050e]/90',
        badgeClass: 'bg-[#ff0055]/15 border-[#ff0055]/40 text-[#ff0055]',
        iconColor: 'text-[#ff0055]',
      }
    case 'info':
    default:
      return {
        label: 'SYSTEM NOTICE',
        icon: <Info className="w-4 h-4 text-[#00c3ff]" />,
        borderClass: 'border-[#00c3ff]/40 shadow-[0_0_15px_rgba(0,195,255,0.15)]',
        bgClass: 'bg-[#05141c]/90',
        badgeClass: 'bg-[#00c3ff]/15 border-[#00c3ff]/30 text-[#00c3ff]',
        iconColor: 'text-[#00c3ff]',
      }
  }
}
