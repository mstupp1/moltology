import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useHeavyVfx } from './useHeavyVfx'
import { HEAVY_VFX_STORAGE_KEY } from '@/lib/vfx-settings'

describe('useHeavyVfx Hook', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides initial false disabled state', () => {
    const { result } = renderHook(() => useHeavyVfx())
    expect(result.current.heavyVfxDisabled).toBe(false)
  })

  it('toggles heavy VFX state correctly via hook', () => {
    const { result } = renderHook(() => useHeavyVfx())

    act(() => {
      result.current.toggleHeavyVfx()
    })

    expect(result.current.heavyVfxDisabled).toBe(true)
    expect(localStorage.getItem(HEAVY_VFX_STORAGE_KEY)).toBe('true')

    act(() => {
      result.current.toggleHeavyVfx()
    })

    expect(result.current.heavyVfxDisabled).toBe(false)
    expect(localStorage.getItem(HEAVY_VFX_STORAGE_KEY)).toBe('false')
  })

  it('allows explicit setting of heavy VFX state', () => {
    const { result } = renderHook(() => useHeavyVfx())

    act(() => {
      result.current.setHeavyVfxDisabled(true)
    })

    expect(result.current.heavyVfxDisabled).toBe(true)
  })
})
