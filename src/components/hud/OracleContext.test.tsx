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
})
