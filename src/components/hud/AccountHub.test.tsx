import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { mergeCompletions } from '@/lib/alignment-tasks'
import { calculateProgression } from '@/lib/progression'
import type { AlignmentContextValue } from '@/hooks/useDailyAlignment'
import { AccountHub } from './AccountHub'

vi.mock('@/hooks/usePortrait3D', () => ({ usePortrait3D: () => null }))
vi.mock('@/lib/auth-client', () => ({ authClient: { signOut: vi.fn().mockResolvedValue({}) } }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to: _to, params: _params, hash: _hash, ...rest }: any) => <a {...rest}>{children}</a>,
}))

const toastSuccess = vi.fn()
vi.mock('@/components/ui/ToastProvider', () => ({
  useOptionalToast: () => ({ toast: { success: toastSuccess, error: vi.fn() } }),
}))

const alignment = {} as AlignmentContextValue
function setAlignment(partial: Partial<AlignmentContextValue>) {
  const xp = partial.xp ?? alignment.xp ?? 0
  Object.assign(alignment, {
    tasks: mergeCompletions([]),
    completedCount: 0,
    totalCount: 8,
    isAllCompleted: false,
    streakDays: 0,
    streakHistory: [],
    history: [],
    isLoading: false,
    isSyncing: false,
    toggleTask: vi.fn(),
    setTaskCompleted: vi.fn(),
    openSilentSynchronization: vi.fn(),
    refetch: vi.fn(),
    currentDate: '2026-11-11',
    isGuest: false,
    stage: 1,
    xpReady: true,
    ...partial,
    xp,
    progression: calculateProgression(xp),
  })
}
vi.mock('@/hooks/useDailyAlignment', () => ({ useDailyAlignment: () => alignment }))

const user = { id: 'member-1', name: 'Bellshot', email: 'bell@example.com' }
const hub = () => <AccountHub variant="desktop" user={user} onNavigate={vi.fn()} />

describe('AccountHub', () => {
  beforeEach(() => {
    localStorage.clear()
    toastSuccess.mockClear()
    setAlignment({ xp: 840, tasks: mergeCompletions(['prompt-construction', 'skill-development']) })
  })
  afterEach(() => vi.useRealTimers())

  it('shows progress to the next sub-stage, the sub-stage badge and today\'s notches', () => {
    render(hub())
    expect(screen.getByTestId('xp-ring-badge')).toHaveTextContent('L-2')
    expect(screen.getByTestId('xp-ring-fill').getAttribute('data-ratio')).toBe((340 / 700).toFixed(3))
    expect(screen.getByTestId('xp-ring-notches').getAttribute('data-done')).toBe('2')
    expect(screen.getByRole('button', { name: /User account menu/ })).toHaveAccessibleName(
      /L-2 Shell Sprout · 360 XP to L-3\. 2 of 8 tasks done today/,
    )
  })

  it('hides the badge and fill until saved XP has loaded', () => {
    setAlignment({ xp: 0, xpReady: false })
    render(hub())
    expect(screen.queryByTestId('xp-ring-badge')).not.toBeInTheDocument()
    expect(screen.getByTestId('xp-ring-fill').getAttribute('data-ratio')).toBe('0.000')
  })

  it('opens one panel with level, today\'s tasks, Settings and Sign out', () => {
    render(hub())
    fireEvent.click(screen.getByRole('button', { name: /User account menu/ }))
    expect(screen.getByTestId('account-hub-level')).toHaveTextContent('340 / 700 XP')
    expect(screen.getByText('Pick your one thing')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('opens full screen on phone, with Settings in the bar and Sign out last', () => {
    render(<AccountHub variant="phone" user={user} onNavigate={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /User account menu/ }))
    const screenEl = screen.getByTestId('account-hub-screen')
    expect(screenEl).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByTestId('account-hub-level')).toBeInTheDocument()
    expect(screen.getByTestId('account-hub-wallet')).toBeInTheDocument()
    const buttons = screenEl.querySelectorAll('button')
    expect(buttons[buttons.length - 1]).toHaveTextContent('Sign out')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('button', { name: /User account menu/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('floats the XP gained', () => {
    const view = render(hub())
    setAlignment({ xp: 850 })
    view.rerender(hub())
    expect(screen.getByTestId('xp-gain')).toHaveTextContent('+10')
  })

  it('celebrates a new sub-stage once, with the loop closing before the badge flips', () => {
    vi.useFakeTimers()
    const view = render(hub())
    expect(localStorage.getItem('moltology:xp-seen:member-1')).toBe('1')
    setAlignment({ xp: 1210 })
    view.rerender(hub())
    expect(screen.getByTestId('xp-ring-fill').getAttribute('data-ratio')).toBe('1.000')
    expect(screen.getByTestId('xp-ring-badge')).toHaveTextContent('L-2')
    act(() => vi.advanceTimersByTime(900))
    expect(screen.getByTestId('xp-ring-badge')).toHaveTextContent('L-3')
    expect(toastSuccess).toHaveBeenCalledWith('First Calcification', expect.objectContaining({ title: 'You reached L-3' }))

    // Unticking back below and earning it again does not repeat the toast.
    setAlignment({ xp: 1190 })
    view.rerender(hub())
    setAlignment({ xp: 1200 })
    view.rerender(hub())
    act(() => vi.advanceTimersByTime(900))
    expect(toastSuccess).toHaveBeenCalledTimes(1)
  })

  it('shows the stage card when a new stage was reached since the last visit', () => {
    localStorage.setItem('moltology:xp-seen:member-1', '2')
    setAlignment({ xp: 2050 })
    render(hub())
    expect(screen.getByTestId('stage-reached')).toHaveTextContent('Stage 2 reached')
    expect(screen.getByTestId('stage-reached')).toHaveTextContent('The Soft-Shed')
  })
})
