import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  isHeavyVfxDisabled,
  setHeavyVfxDisabled,
  toggleHeavyVfx,
  HEAVY_VFX_STORAGE_KEY,
  HEAVY_VFX_CHANGE_EVENT,
} from './vfx-settings'

describe('VFX Settings Utility', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to false when no localStorage item is set', () => {
    expect(isHeavyVfxDisabled()).toBe(false)
  })

  it('returns true when stored in localStorage as "true"', () => {
    localStorage.setItem(HEAVY_VFX_STORAGE_KEY, 'true')
    expect(isHeavyVfxDisabled()).toBe(true)
  })

  it('updates localStorage and dispatches event when setting heavy VFX state', () => {
    const listener = vi.fn()
    window.addEventListener(HEAVY_VFX_CHANGE_EVENT, listener)

    setHeavyVfxDisabled(true)
    expect(localStorage.getItem(HEAVY_VFX_STORAGE_KEY)).toBe('true')
    expect(isHeavyVfxDisabled()).toBe(true)
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(HEAVY_VFX_CHANGE_EVENT, listener)
  })

  it('toggles heavy VFX state correctly', () => {
    expect(isHeavyVfxDisabled()).toBe(false)
    const result1 = toggleHeavyVfx()
    expect(result1).toBe(true)
    expect(isHeavyVfxDisabled()).toBe(true)

    const result2 = toggleHeavyVfx()
    expect(result2).toBe(false)
    expect(isHeavyVfxDisabled()).toBe(false)
  })
})
