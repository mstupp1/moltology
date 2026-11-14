import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { renderHook, act } from '@testing-library/react'
import { OracleProvider, useOracle, useSafeOracle } from './OracleContext'

// Mock TanStack router hooks
vi.mock('@tanstack/react-router', () => ({
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
}))

let mockUser: any = null

// Mock authClient
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () =>
      mockUser
        ? { data: { user: mockUser }, isPending: false }
        : { data: null, isPending: false },
  },
}))

// Mock server API
vi.mock('@/lib/server/api', () => ({
  getAIThreadsFn: vi.fn().mockResolvedValue([]),
}))

describe('OracleContext & Mode Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUser = null
  })

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

  it('turns sidebar into the overlay on phones and the page on tablets', () => {
    const originalWidth = window.innerWidth
    window.innerWidth = 700

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OracleProvider>{children}</OracleProvider>
    )

    const { result } = renderHook(() => useOracle(), { wrapper })

    act(() => {
      result.current.setMode('sidebar')
    })
    expect(result.current.mode).toBe('page')

    act(() => result.current.setMode('closed'))
    window.innerWidth = 390
    act(() => result.current.setMode('sidebar'))
    expect(result.current.mode).toBe('popout')
    // A phone's overlay is not saved as the desktop preference.
    expect(result.current.lastActiveMode).toBe('page')

    window.innerWidth = originalWidth
  })

  it('always opens the slide-up overlay from the phone core, whatever desktop last used', () => {
    const originalWidth = window.innerWidth
    window.innerWidth = 390
    const wrapper = ({ children }: { children: React.ReactNode }) => <OracleProvider>{children}</OracleProvider>
    const { result } = renderHook(() => useOracle(), { wrapper })
    act(() => result.current.toggleMode('page'))
    expect(result.current.mode).toBe('popout')
    act(() => result.current.toggleMode('popout'))
    expect(result.current.mode).toBe('closed')
    window.innerWidth = originalWidth
  })

  it('keeps a docked chat reachable when resizing to a mobile viewport', () => {
    const originalWidth = window.innerWidth
    window.innerWidth = 1200
    const wrapper = ({ children }: { children: React.ReactNode }) => <OracleProvider>{children}</OracleProvider>
    const { result } = renderHook(() => useOracle(), { wrapper })
    act(() => result.current.setMode('sidebar'))
    act(() => {
      window.innerWidth = 390
      window.dispatchEvent(new Event('resize'))
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

  it('keeps activeThreadId as null after loading threads so new chat screen is presented initially', async () => {
    mockUser = { id: 'usr_initiate_test', name: 'Test Initiate' }
    const { getAIThreadsFn } = await import('@/lib/server/api')
    ;(getAIThreadsFn as any).mockResolvedValue([
      { id: 'thread-existing-1', title: 'Prior Consultation' },
      { id: 'thread-existing-2', title: 'Deep Trench Analysis' },
    ])

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OracleProvider>{children}</OracleProvider>
    )

    const { result } = renderHook(() => useOracle(), { wrapper })

    expect(result.current.activeThreadId).toBeNull()

    await act(async () => {
      await result.current.refreshThreads()
    })

    expect(result.current.threads).toHaveLength(2)
    expect(result.current.activeThreadId).toBeNull()
  })
})
