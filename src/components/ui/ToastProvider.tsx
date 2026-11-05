import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useRouter } from '@tanstack/react-router'
import { AlertCircle, AlertTriangle, Bell, CheckCircle2, Info, X } from 'lucide-react'

export type ToastType = 'info' | 'success' | 'warning' | 'error' | 'hud'

export interface ToastItem {
  id: string
  title?: string
  message: string
  type: ToastType
  duration?: number
  timestamp: number
  /** Replaces the type's icon, e.g. the gem image on a reward toast. */
  icon?: React.ReactNode
  /** A small link button, e.g. "Market". */
  action?: ToastAction
}

export interface ToastAction {
  label: string
  href: string
}

export interface ToastOptions {
  id?: string
  title?: string
  duration?: number
  type?: ToastType
  icon?: React.ReactNode
  action?: ToastAction
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

export function useOptionalToast(): ToastContextType | undefined {
  return useContext(ToastContext)
}

const DEFAULT_DURATION = 5000

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const recentToastsRef = React.useRef<Map<string, number>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
    recentToastsRef.current.clear()
  }, [])

  const addToast = useCallback(
    (message: string, options: ToastOptions = {}): string => {
      const type = options.type || 'info'
      const title = options.title || ''
      const duration = options.duration ?? DEFAULT_DURATION
      const now = Date.now()

      // Deduplicate identical toasts dispatched in rapid succession (< 2000ms)
      const dedupeKey = options.id ? `id:${options.id}` : `msg:${type}:${title}:${message}`
      const lastTriggered = recentToastsRef.current.get(dedupeKey)

      if (lastTriggered && now - lastTriggered < 2000) {
        return options.id || dedupeKey
      }

      recentToastsRef.current.set(dedupeKey, now)

      // Prune stale cache entries
      if (recentToastsRef.current.size > 50) {
        for (const [k, ts] of recentToastsRef.current.entries()) {
          if (now - ts > 10000) {
            recentToastsRef.current.delete(k)
          }
        }
      }

      const id = options.id || `toast-${now}-${Math.random().toString(36).substring(2, 7)}`

      const newToast: ToastItem = {
        id,
        title: options.title,
        message,
        type,
        duration,
        timestamp: now,
        icon: options.icon,
        action: options.action,
      }

      setToasts((prev) => {
        if (prev.some((item) => item.id === id)) {
          return prev
        }
        return [newToast, ...prev].slice(0, 5) // Max 5 active floating toasts
      })

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
      className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 max-w-md w-[calc(100%-1.5rem)] pointer-events-none"
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
  const action = toast.action

  return (
    <div
      className="pointer-events-auto w-full flex items-start gap-3 px-3.5 py-3 rounded-card border border-line-subtle bg-surface-2/95 shadow-menu backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3"
      role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
      data-toast-type={toast.type}
    >
      <div className={`mt-px shrink-0 ${styles.iconColor}`}>
        {toast.icon ?? styles.icon}
      </div>

      <div className="flex-1 min-w-0">
        <span className="sr-only">{styles.label}: </span>
        {toast.title && (
          <p className="text-sm font-semibold text-ink leading-snug">
            {toast.title}
          </p>
        )}
        <p className={`text-[13px] leading-snug break-words ${toast.title ? 'text-ink-body mt-0.5' : 'text-ink'}`}>
          {toast.message}
        </p>
      </div>

      {action && <ToastActionLink action={action} onDone={() => onDismiss(toast.id)} />}

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 -mr-1 -mt-0.5 p-1 rounded-control text-ink-muted hover:text-ink hover:bg-surface-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/** Kept separate so toasts without an action never touch the router. */
function ToastActionLink({ action, onDone }: { action: ToastAction; onDone: () => void }) {
  const router = useRouter({ warn: false })
  return (
    <a
      href={action.href}
      onClick={(event) => {
        onDone()
        if (!router || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        void router.navigate({ to: action.href })
      }}
      className="self-center shrink-0 min-h-8 inline-flex items-center px-2.5 rounded-control border border-line text-[12px] font-semibold text-ink hover:border-line-hover hover:bg-surface-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
    >
      {action.label}
    </a>
  )
}

/** One coloured icon per type; the card itself stays neutral. */
function getToastStyles(type: ToastType) {
  switch (type) {
    case 'success':
      return { label: 'Done', icon: <CheckCircle2 className="w-4 h-4" />, iconColor: 'text-emerald-500' }
    case 'warning':
      return { label: 'Warning', icon: <AlertTriangle className="w-4 h-4" />, iconColor: 'text-amber-500' }
    case 'error':
      return { label: 'Error', icon: <AlertCircle className="w-4 h-4" />, iconColor: 'text-crimson-text' }
    case 'hud':
      return { label: 'Notice', icon: <Bell className="w-4 h-4" />, iconColor: 'text-cyan-glow' }
    case 'info':
    default:
      return { label: 'Info', icon: <Info className="w-4 h-4" />, iconColor: 'text-cyan-glow' }
  }
}
