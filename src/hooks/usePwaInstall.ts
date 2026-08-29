import { useCallback, useEffect, useState } from 'react'
import {
  captureInstallPrompt,
  clearDeferredInstallPrompt,
  dismissInstallBanner,
  getDeferredInstallPrompt,
  isBrowser,
  isStandaloneDisplay,
  promptHubInstall,
  readInstallBannerDismissed,
  registerHubServiceWorker,
  type BeforeInstallPromptEventLike,
} from '@/lib/pwa'

export type PwaInstallState = {
  isStandalone: boolean
  canPromptInstall: boolean
  showInstallBanner: boolean
  dismissBanner: () => void
  install: () => Promise<'accepted' | 'dismissed' | 'unavailable'>
}

/**
 * Registers the hub service worker and tracks installability.
 * Safe for guest + signed-in hub shells.
 */
export function usePwaInstall(): PwaInstallState {
  const [isStandalone, setIsStandalone] = useState(false)
  const [canPromptInstall, setCanPromptInstall] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(true)

  useEffect(() => {
    if (!isBrowser()) return

    setIsStandalone(isStandaloneDisplay())
    setBannerDismissed(readInstallBannerDismissed())
    setCanPromptInstall(Boolean(getDeferredInstallPrompt()))

    void registerHubServiceWorker()

    const onBeforeInstall = (event: Event) => {
      captureInstallPrompt(event)
      setCanPromptInstall(true)
    }

    const onInstalled = () => {
      clearDeferredInstallPrompt()
      setCanPromptInstall(false)
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onDisplayMode = () => setIsStandalone(isStandaloneDisplay())
    mq?.addEventListener?.('change', onDisplayMode)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', onDisplayMode)
    }
  }, [])

  const dismissBanner = useCallback(() => {
    dismissInstallBanner()
    setBannerDismissed(true)
  }, [])

  const install = useCallback(async () => {
    const outcome = await promptHubInstall()
    if (outcome !== 'unavailable') {
      setCanPromptInstall(Boolean(getDeferredInstallPrompt()))
    }
    if (outcome === 'accepted') {
      setIsStandalone(true)
    }
    return outcome
  }, [])

  return {
    isStandalone,
    canPromptInstall,
    showInstallBanner: canPromptInstall && !isStandalone && !bannerDismissed,
    dismissBanner,
    install,
  }
}

/** Narrow re-export for tests / callers that capture the event type. */
export type { BeforeInstallPromptEventLike }
