import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HudLayout } from '@/components/hud/HudLayout'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  useRouter: () => ({ preloadRoute: vi.fn() }),
  Outlet: () => null,
  createFileRoute: () => (config: any) => config,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    getSession: vi.fn(() => Promise.resolve({ data: null })),
  },
}))

describe('HUD Welcome Splash (Guest Demo & User First Visit)', () => {
  const renderHud = () =>
    render(
      <ToastProvider>
        <HudLayout />
      </ToastProvider>
    )

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers welcome popup for guest demo mode on first visit', () => {
    renderHud()

    expect(screen.getByText('WELCOME, GUEST')).toBeInTheDocument()
    expect(screen.getByText('⬡ MOLTOLOGY SIGNAL RECEIVED ⬡')).toBeInTheDocument()
  })

  it('dismisses welcome popup for guest demo mode and sets localStorage key', () => {
    renderHud()

    expect(screen.getByText('WELCOME, GUEST')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    act(() => {
      vi.advanceTimersByTime(550)
    })

    expect(localStorage.getItem('moltology:welcomed:guest')).toBe('1')
  })

  it('does not show welcome popup if guest demo user was already welcomed', () => {
    localStorage.setItem('moltology:welcomed:guest', '1')

    renderHud()

    expect(screen.queryByText('WELCOME, GUEST')).not.toBeInTheDocument()
  })

  it('does not flash WELCOME, GUEST while the session is unresolved', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
    renderHud()
    expect(screen.queryByText('WELCOME, GUEST')).not.toBeInTheDocument()
  })

  it('triggers welcome popup with user name for logged-in user on first visit', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-789', name: 'Commander Crustacean' } },
    } as any)

    renderHud()

    expect(screen.getByText('WELCOME, COMMANDER')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    act(() => {
      vi.advanceTimersByTime(550)
    })

    expect(localStorage.getItem('moltology:welcomed:user-789')).toBe('1')
  })
})
