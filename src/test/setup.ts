import 'dotenv/config'
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { clearOAuthPending, endSignOut } from '@/lib/auth-session'
import { clearCachedJwt } from '@/lib/jwt-cache'
import { getQueryClient } from '@/lib/query/client'

// Tests see a failed read at once instead of after the app's one retry.
getQueryClient().setDefaultOptions({
  queries: { ...getQueryClient().getDefaultOptions().queries, retry: false },
})

// Automatically cleanup DOM, storage, and session latches after each test
afterEach(() => {
  cleanup()
  endSignOut()
  clearOAuthPending()
  clearCachedJwt()
  // One shared query client per tab: start every test with an empty account cache.
  getQueryClient().clear()
  if (typeof window !== 'undefined') {
    window.localStorage?.clear()
    window.sessionStorage?.clear()
  }
})

// Radix UI / JSDOM Polyfills
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

