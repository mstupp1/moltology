import React, { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { canRegisterServiceWorker, isBrowser } from '@/lib/pwa'

/**
 * Focuses hub navigation when a system notification is activated.
 */
export function PwaNotificationBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    if (!isBrowser() || !canRegisterServiceWorker()) return

    const onMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || data.type !== 'MOLTOLOGY_NOTIFICATION_CLICK') return
      const url = typeof data.url === 'string' ? data.url : '/dashboard'
      try {
        const parsed = new URL(url, window.location.origin)
        if (parsed.origin === window.location.origin) {
          void navigate({ to: parsed.pathname + parsed.search })
        }
      } catch {
        void navigate({ to: '/dashboard' })
      }
    }

    navigator.serviceWorker.addEventListener('message', onMessage)
    return () => navigator.serviceWorker.removeEventListener('message', onMessage)
  }, [navigate])

  return null
}
