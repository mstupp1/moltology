import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { env } from '@/env'
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react'

export interface TurnstileWidgetRef {
  reset: () => void
  remove: () => void
}

export interface TurnstileWidgetProps {
  siteKey?: string
  action?: string
  cdata?: string
  theme?: 'dark' | 'light' | 'auto'
  size?: 'normal' | 'compact' | 'flexible' | 'invisible'
  appearance?: 'always' | 'execute' | 'interaction-only'
  onVerify: (token: string) => void
  onError?: (errorCode?: string) => void
  onExpire?: () => void
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string
          action?: string
          cdata?: string
          theme?: 'dark' | 'light' | 'auto'
          size?: 'normal' | 'compact' | 'flexible' | 'invisible'
          appearance?: 'always' | 'execute' | 'interaction-only'
          callback?: (token: string) => void
          'error-callback'?: (errorCode?: string) => void
          'expired-callback'?: () => void
          'timeout-callback'?: () => void
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
      execute: (container?: string | HTMLElement, params?: any) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let isScriptLoading = false
let isScriptLoaded = false
const scriptLoadCallbacks: Array<() => void> = []

function loadTurnstileScript(callback: () => void) {
  if (typeof window === 'undefined') return

  if (window.turnstile) {
    callback()
    return
  }

  if (isScriptLoaded) {
    callback()
    return
  }

  scriptLoadCallbacks.push(callback)

  if (isScriptLoading) return

  isScriptLoading = true

  const script = document.createElement('script')
  script.src = TURNSTILE_SCRIPT_SRC
  script.async = true
  script.defer = true

  script.onload = () => {
    isScriptLoaded = true
    isScriptLoading = false
    while (scriptLoadCallbacks.length > 0) {
      const cb = scriptLoadCallbacks.shift()
      cb?.()
    }
  }

  script.onerror = () => {
    isScriptLoading = false
    console.error('[TurnstileWidget] Failed to load Cloudflare Turnstile script.')
  }

  document.head.appendChild(script)
}

export const TurnstileWidget = forwardRef<TurnstileWidgetRef, TurnstileWidgetProps>(
  (
    {
      siteKey,
      action,
      cdata,
      theme = 'dark',
      size = 'flexible',
      appearance = 'interaction-only',
      onVerify,
      onError,
      onExpire,
      className = '',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready' | 'verified' | 'error' | 'expired'>('loading')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    const resolvedSiteKey = siteKey || env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

    const reset = () => {
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current)
        setStatus('ready')
        setErrorMessage(null)
      }
    }

    const remove = () => {
      if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }

    useImperativeHandle(ref, () => ({
      reset,
      remove,
    }))

    useEffect(() => {
      let isMounted = true

      loadTurnstileScript(() => {
        if (!isMounted || !containerRef.current || !window.turnstile) return

        // Clean up any existing widget in this container before re-rendering
        if (widgetIdRef.current) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // ignore
          }
          widgetIdRef.current = null
        }

        try {
          const id = window.turnstile.render(containerRef.current, {
            sitekey: resolvedSiteKey,
            action,
            cdata,
            theme,
            size,
            appearance,
            callback: (token: string) => {
              if (isMounted) {
                setStatus('verified')
                setErrorMessage(null)
                onVerify(token)
              }
            },
            'error-callback': (errorCode?: string) => {
              if (isMounted) {
                setStatus('error')
                setErrorMessage(errorCode || 'Verification challenge failed')
                onError?.(errorCode)
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                setStatus('expired')
                onExpire?.()
              }
            },
          })

          widgetIdRef.current = id
          if (isMounted) {
            setStatus('ready')
          }
        } catch (err: any) {
          console.warn('[TurnstileWidget] Render error:', err)
          if (isMounted) {
            setStatus('error')
            setErrorMessage(err?.message || 'Failed to render verification challenge')
          }
        }
      })

      return () => {
        isMounted = false
        if (widgetIdRef.current && typeof window !== 'undefined' && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {
            // ignore
          }
          widgetIdRef.current = null
        }
      }
    }, [resolvedSiteKey, action, cdata, theme, size, appearance])

    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div ref={containerRef} className="flex items-center justify-center" />

        {status === 'error' && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorMessage || 'Verification error.'}</span>
            <button
              type="button"
              onClick={reset}
              className="ml-1 inline-flex items-center gap-1 text-[11px] underline hover:text-rose-300 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {status === 'expired' && (
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Verification expired.</span>
            <button
              type="button"
              onClick={reset}
              className="ml-1 inline-flex items-center gap-1 text-[11px] underline hover:text-amber-300 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        )}
      </div>
    )
  }
)

TurnstileWidget.displayName = 'TurnstileWidget'
