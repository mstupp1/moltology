import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { OracleProvider, useOracle, useSafeOracle } from './OracleContext'

// Mock TanStack router hooks
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
}))

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
  },
}))

// Mock server API
vi.mock('@/lib/server/api', () => ({
  getAIThreadsFn: vi.fn().mockResolvedValue([]),
}))

describe('OracleContext & Mode Management', () => {
  it('useSafeOracle returns undefined when used outside of OracleProvider', () => {
    const { result } = renderHook(() => useSafeOracle())
    expect(result.current).toBeUndefined()
  })

  it('provides default closed mode and allows mode switching', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OracleProvider>{children}</OracleProvider>
    )

    const { result } = renderHook(() => useOracle(), { wrapper })

    expect(result.current.mode).toBe('closed')

    act(() => {
      result.current.setMode('popout')
    })
    expect(result.current.mode).toBe('popout')

    act(() => {
      result.current.setMode('sidebar')
    })
    expect(result.current.mode).toBe('sidebar')

    act(() => {
      result.current.toggleMode('sidebar')
    })
    expect(result.current.mode).toBe('closed')
  })

  it('enforces mutual exclusivity where toggling popout activates popout and clears previous mode', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OracleProvider>{children}</OracleProvider>
    )

    const { result } = renderHook(() => useOracle(), { wrapper })

    act(() => {
      result.current.setMode('sidebar')
    })
    expect(result.current.mode).toBe('sidebar')

    act(() => {
      result.current.setMode('popout')
    })
    expect(result.current.mode).toBe('popout')
    expect(result.current.mode).not.toBe('sidebar')
  })

  it('redirects sidebar mode to page mode on mobile viewports', () => {
    const originalWidth = window.innerWidth
    window.innerWidth = 500

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OracleProvider>{children}</OracleProvider>
    )

    const { result } = renderHook(() => useOracle(), { wrapper })

    act(() => {
      result.current.setMode('sidebar')
    })
    expect(result.current.mode).toBe('page')

    window.innerWidth = originalWidth
  })

  it('preserves sidebar mode when closing and reopening without arguments', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OracleProvider>{children}</OracleProvider>
    )

    const { result } = renderHook(() => useOracle(), { wrapper })

    // Activate sidebar mode
    act(() => {
      result.current.setMode('sidebar')
    })
    expect(result.current.mode).toBe('sidebar')
    expect(result.current.lastActiveMode).toBe('sidebar')

    // Close the Oracle
    act(() => {
      result.current.setMode('closed')
    })
    expect(result.current.mode).toBe('closed')
    expect(result.current.lastActiveMode).toBe('sidebar')

    // Reopen without explicit mode argument (e.g. clicking launcher button)
    act(() => {
      result.current.toggleMode()
    })
    expect(result.current.mode).toBe('sidebar')
  })
})
