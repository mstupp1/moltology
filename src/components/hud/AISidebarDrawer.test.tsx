import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AISidebarDrawer } from './AISidebarDrawer'

vi.mock('./OracleContext', () => ({ useSafeOracle: () => null }))
vi.mock('../ai/AIChatPanel', () => ({
  AIChatPanel: ({ onClose }: { onClose: () => void }) => <button onClick={onClose}>Close chat</button>,
}))

beforeEach(() => {
  localStorage.clear()
  window.innerWidth = 1200
})
afterEach(() => vi.useRealTimers())

it('exits toward the right, stays inert until unmount, and cancels stale exits', () => {
  vi.useFakeTimers()
  const { rerender } = render(<AISidebarDrawer isOpen />)
  act(() => vi.advanceTimersByTime(20))
  const drawer = screen.getByRole('complementary')
  expect(drawer).toHaveClass('translate-x-0')
  rerender(<AISidebarDrawer isOpen={false} />)
  expect(drawer).toHaveClass('translate-x-full')
  expect(drawer).toHaveAttribute('inert')
  act(() => vi.advanceTimersByTime(100))
  rerender(<AISidebarDrawer isOpen />)
  act(() => vi.advanceTimersByTime(250))
  expect(screen.getByRole('complementary')).toBe(drawer)
  expect(drawer).not.toHaveAttribute('inert')
  rerender(<AISidebarDrawer isOpen={false} />)
  act(() => vi.advanceTimersByTime(200))
  expect(drawer).not.toBeInTheDocument()
})

it('preserves keyboard resizing, clamping and resetting the docked width', () => {
  localStorage.setItem('moltology:oracle_sidebar_width', '700')
  render(<AISidebarDrawer isOpen />)
  const separator = screen.getByRole('separator')
  fireEvent.keyDown(separator, { key: 'ArrowLeft' })
  expect(screen.getByRole('complementary')).toHaveStyle({ width: '720px' })
  fireEvent.keyDown(separator, { key: 'ArrowRight' })
  expect(localStorage.getItem('moltology:oracle_sidebar_width')).toBe('688')
  fireEvent.doubleClick(separator)
  expect(localStorage.getItem('moltology:oracle_sidebar_width')).toBeNull()
  expect(screen.getByRole('complementary')).toHaveClass('w-80', 'lg:w-96')
})
