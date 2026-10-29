import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useDesktopViewport } from './useDesktopViewport'

afterEach(() => vi.unstubAllGlobals())

it('tracks the HUD desktop breakpoint as the viewport changes', () => {
  let matches = false
  let onChange: (() => void) | undefined
  const removeEventListener = vi.fn()
  const matchMedia = vi.fn(() => ({
    get matches() { return matches },
    addEventListener: (_event: string, listener: () => void) => { onChange = listener },
    removeEventListener,
  }))
  vi.stubGlobal('matchMedia', matchMedia)

  const { result, unmount } = renderHook(() => useDesktopViewport())
  expect(matchMedia).toHaveBeenCalledWith('(min-width: 768px)')
  expect(result.current).toBe(false)

  act(() => { matches = true; onChange?.() })
  expect(result.current).toBe(true)
  act(() => { matches = false; onChange?.() })
  expect(result.current).toBe(false)

  unmount()
  expect(removeEventListener).toHaveBeenCalledWith('change', onChange)
})
