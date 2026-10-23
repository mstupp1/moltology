import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const reload = vi.fn()

beforeEach(() => {
  vi.resetModules()
  reload.mockReset()
  window.sessionStorage.clear()
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('isStaleChunkError', () => {
  it('matches the missing-chunk messages each browser throws', async () => {
    const { isStaleChunkError } = await import('./stale-chunk')
    expect(
      isStaleChunkError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://moltology.org/assets/index-BK1FoT-z.js',
        ),
      ),
    ).toBe(true)
    expect(isStaleChunkError(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(isStaleChunkError(new TypeError('Importing a module script failed.'))).toBe(true)
    expect(isStaleChunkError(new Error('Unable to preload CSS for /assets/forum-x.css'))).toBe(true)
  })

  it('ignores ordinary errors', async () => {
    const { isStaleChunkError } = await import('./stale-chunk')
    expect(isStaleChunkError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isStaleChunkError(undefined)).toBe(false)
  })
})

describe('reloadForStaleChunk', () => {
  it('reloads once, then stops while the guard window is open', async () => {
    const { reloadForStaleChunk, isStaleChunkReloadPending } = await import('./stale-chunk')
    expect(reloadForStaleChunk(1_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(isStaleChunkReloadPending()).toBe(true)

    // Same page asking again does not reload twice.
    expect(reloadForStaleChunk(2_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(1)

    // The reloaded page (fresh module state) still failing inside 30s gives up.
    vi.resetModules()
    const fresh = await import('./stale-chunk')
    expect(fresh.reloadForStaleChunk(20_000)).toBe(false)
    expect(reload).toHaveBeenCalledTimes(1)

    // A later deploy can reload again.
    expect(fresh.reloadForStaleChunk(40_000)).toBe(true)
    expect(reload).toHaveBeenCalledTimes(2)
  })

  it('never reloads when sessionStorage is blocked', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { reloadForStaleChunk } = await import('./stale-chunk')
    expect(reloadForStaleChunk()).toBe(false)
    expect(reload).not.toHaveBeenCalled()
  })
})
