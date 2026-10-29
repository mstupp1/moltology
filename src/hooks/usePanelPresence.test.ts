import { act, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { usePanelPresence } from './usePanelPresence'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it('cancels a pending exit when a panel reopens', () => {
  vi.useFakeTimers()
  const { result, rerender } = renderHook(({ open }) => usePanelPresence(open), { initialProps: { open: true } })
  act(() => vi.advanceTimersByTime(20))
  expect(result.current.visible).toBe(true)
  rerender({ open: false })
  expect(result.current).toEqual({ mounted: true, visible: false })
  act(() => vi.advanceTimersByTime(100))
  rerender({ open: true })
  act(() => vi.advanceTimersByTime(250))
  expect(result.current).toEqual({ mounted: true, visible: true })
})

it('does not retain a closing panel for an animation when reduced motion is enabled', () => {
  vi.useFakeTimers()
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const { result, rerender } = renderHook(({ open }) => usePanelPresence(open), { initialProps: { open: true } })
  act(() => vi.advanceTimersByTime(0))
  expect(result.current.visible).toBe(true)
  rerender({ open: false })
  act(() => vi.advanceTimersByTime(0))
  expect(result.current.mounted).toBe(false)
})
