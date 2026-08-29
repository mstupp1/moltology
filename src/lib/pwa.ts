/**
 * Command Hub progressive web surface helpers.
 * Install / standalone detection and service worker registration.
 * Push subscription wiring can attach later without changing this surface API.
 */

export const PWA_DISMISS_STORAGE_KEY = 'moltology_pwa_install_dismissed'
export const SW_URL = '/sw.js'

export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: BeforeInstallPromptEventLike | null = null
let registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null

/** Test-only reset for module singletons. */
export function resetPwaSingletonsForTests(): void {
  deferredPrompt = null
  registrationPromise = null
}

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined'
}

export function isStandaloneDisplay(): boolean {
  if (!isBrowser()) return false
  const mq = window.matchMedia?.('(display-mode: standalone)')
  const iosStandalone = 'standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  return Boolean(mq?.matches || iosStandalone)
}

export function canRegisterServiceWorker(): boolean {
  return isBrowser() && 'serviceWorker' in navigator
}

export function getDeferredInstallPrompt(): BeforeInstallPromptEventLike | null {
  return deferredPrompt
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null
}

export function captureInstallPrompt(event: Event): BeforeInstallPromptEventLike {
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEventLike
  return deferredPrompt
}

export async function registerHubServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!canRegisterServiceWorker()) return null
  if (!registrationPromise) {
    registrationPromise = navigator.serviceWorker
      .register(SW_URL, { scope: '/' })
      .then((reg) => reg)
      .catch(() => null)
  }
  return registrationPromise
}

export async function getHubServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!canRegisterServiceWorker()) return null
  try {
    const existing = await navigator.serviceWorker.getRegistration('/')
    if (existing) return existing
  } catch {
    // fall through
  }
  return registerHubServiceWorker()
}

export function readInstallBannerDismissed(): boolean {
  if (!isBrowser()) return false
  try {
    return localStorage.getItem(PWA_DISMISS_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function dismissInstallBanner(): void {
  if (!isBrowser()) return
  try {
    localStorage.setItem(PWA_DISMISS_STORAGE_KEY, '1')
  } catch {
    // ignore quota / private mode
  }
}

export async function promptHubInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const promptEvent = deferredPrompt
  if (!promptEvent) return 'unavailable'
  try {
    await promptEvent.prompt()
    const choice = await promptEvent.userChoice
    deferredPrompt = null
    return choice.outcome
  } catch {
    return 'unavailable'
  }
}
