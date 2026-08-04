import React from 'react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HudLayout } from '../_hud'
import { authClient } from '@/lib/auth-client'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
  Outlet: () => null,
  createFileRoute: () => (config: any) => config,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    getSession: vi.fn(() => Promise.resolve({ data: null })),
  },
}))

describe('HUD Welcome Splash (Guest Demo & User First Visit)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('triggers welcome popup for guest demo mode on first visit', () => {
    render(<HudLayout />)

    expect(screen.getByText('WELCOME, GUEST')).toBeInTheDocument()
    expect(screen.getByText('⬡ MOLTOLOGY SIGNAL RECEIVED ⬡')).toBeInTheDocument()
  })

  it('dismisses welcome popup for guest demo mode and sets localStorage key', () => {
    render(<HudLayout />)

    expect(screen.getByText('WELCOME, GUEST')).toBeInTheDocument()

    const skipBtn = screen.getByText(/skip transmission/i)
    fireEvent.click(skipBtn)

    act(() => {
      vi.advanceTimersByTime(550)
    })

    expect(localStorage.getItem('moltology:welcomed:guest')).toBe('1')
  })

  it('does not show welcome popup if guest demo user was already welcomed', () => {
    localStorage.setItem('moltology:welcomed:guest', '1')

    render(<HudLayout />)

    expect(screen.queryByText('WELCOME, GUEST')).not.toBeInTheDocument()
  })

  it('triggers welcome popup with user name for logged-in user on first visit', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-789', name: 'Commander Crustacean' } },
    } as any)

    render(<HudLayout />)

    expect(screen.getByText('WELCOME, COMMANDER')).toBeInTheDocument()

    const skipBtn = screen.getByText(/skip transmission/i)
    fireEvent.click(skipBtn)

    act(() => {
      vi.advanceTimersByTime(550)
    })

    expect(localStorage.getItem('moltology:welcomed:user-789')).toBe('1')
  })
})
