import 'dotenv/config'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { clearOAuthPending, endSignOut } from '@/lib/auth-session'

// Automatically cleanup DOM, storage, and session latches after each test
afterEach(() => {
  cleanup()
  endSignOut()
  clearOAuthPending()
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

