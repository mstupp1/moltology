import 'dotenv/config'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Automatically cleanup DOM after each test
afterEach(() => {
  cleanup()
})

// Radix UI / JSDOM Polyfills
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

