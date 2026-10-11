import { describe, expect, it } from 'vitest'
import { advanceServiceWorkerVersion } from './mockup-cache-version'

describe('marketing service worker refresh', () => {
  it('advances both plain and brand-suffixed cache versions without losing the brand token', () => {
    expect(advanceServiceWorkerVersion("const VERSION = 'moltology-hub-v3'")).toEqual({ version: 4, content: "const VERSION = 'moltology-hub-v4'" })
    expect(advanceServiceWorkerVersion("const VERSION = 'moltology-hub-v3-brand-f32bacae0bf5'\nconst OTHER = 1").content)
      .toBe("const VERSION = 'moltology-hub-v4-brand-f32bacae0bf5'\nconst OTHER = 1")
  })
  it('fails clearly when the cache namespace cannot be refreshed', () => {
    expect(() => advanceServiceWorkerVersion('no cache version')).toThrow('Could not find')
  })
})
