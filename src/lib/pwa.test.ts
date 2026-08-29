import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  PWA_DISMISS_STORAGE_KEY,
  SW_URL,
  captureInstallPrompt,
  clearDeferredInstallPrompt,
  dismissInstallBanner,
  getDeferredInstallPrompt,
  isStandaloneDisplay,
  promptHubInstall,
  readInstallBannerDismissed,
  registerHubServiceWorker,
  resetPwaSingletonsForTests,
} from './pwa'

describe('pwa helpers', () => {
  beforeEach(() => {
    localStorage.clear()
    resetPwaSingletonsForTests()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    resetPwaSingletonsForTests()
  })

  it('tracks install banner dismissal', () => {
    expect(readInstallBannerDismissed()).toBe(false)
    dismissInstallBanner()
    expect(localStorage.getItem(PWA_DISMISS_STORAGE_KEY)).toBe('1')
    expect(readInstallBannerDismissed()).toBe(true)
  })

  it('captures and clears beforeinstallprompt', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined)
    const userChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' })
    const event = {
      preventDefault: vi.fn(),
      prompt,
      userChoice,
    } as unknown as Event

    captureInstallPrompt(event)
    expect(getDeferredInstallPrompt()).toBeTruthy()
    await expect(promptHubInstall()).resolves.toBe('accepted')
    expect(prompt).toHaveBeenCalled()
    expect(getDeferredInstallPrompt()).toBeNull()
  })

  it('returns unavailable when no install prompt is queued', async () => {
    await expect(promptHubInstall()).resolves.toBe('unavailable')
  })

  it('registers the hub service worker at /sw.js', async () => {
    const register = vi.fn().mockResolvedValue({ scope: '/' })
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    })

    const reg = await registerHubServiceWorker()
    expect(register).toHaveBeenCalledWith(SW_URL, { scope: '/' })
    expect(reg).toEqual({ scope: '/' })
  })

  it('detects standalone display mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    })
    expect(isStandaloneDisplay()).toBe(true)
  })
})
