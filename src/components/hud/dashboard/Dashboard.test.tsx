import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { authClient } from '@/lib/auth-client'
import { getAIThreadsFn, getBlogPostsFn } from '@/lib/server/api'
import { OPEN_ALIGNMENT_PANEL_EVENT } from '@/lib/alignment-panel'
import { DashboardTodayStrip } from './DashboardTodayStrip'
import { DASHBOARD_PROMOS, DashboardPromoBanner } from './DashboardPromoBanner'
import { DASHBOARD_SHORTCUTS, DashboardShortcuts } from './DashboardShortcuts'
import { DashboardNewsPanel } from './DashboardNewsPanel'
import { DashboardChangelogPanel, formatReleaseDay } from './DashboardChangelogPanel'
import { DashboardEmptyRow } from './DashboardPanel'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
  Link: ({ children, to, params, ...props }: any) => {
    const href = String(to ?? '').replace('$slug', params?.slug ?? '')
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: { useSession: vi.fn() },
}))

vi.mock('@/components/hud/OracleContext', () => ({
  useSafeOracle: vi.fn(() => undefined),
}))

vi.mock('@/components/AuthModal', () => ({
  AuthModal: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="auth-modal" /> : null),
}))

vi.mock('@/lib/ai/oracle-auth-client', () => ({
  oracleAuthData: vi.fn().mockResolvedValue({ userId: 'u1' }),
}))

vi.mock('@/lib/server/api', () => ({
  getAIThreadsFn: vi.fn().mockResolvedValue([]),
  getBlogPostsFn: vi.fn().mockResolvedValue([]),
}))

vi.mock('@/lib/changelogs', () => ({
  getPublicChangelogs: vi.fn().mockResolvedValue([]),
}))

describe('DashboardTodayStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('asks a guest to join and opens sign-up', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null, isPending: false } as any)
    render(<DashboardTodayStrip />)

    expect(screen.getByRole('heading', { name: 'Welcome to the shallows' })).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('dashboard-next-step'))
    expect(screen.getByTestId('auth-modal')).toBeInTheDocument()
  })

  it('greets a member by first name and opens the alignment panel as the next step', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'u1', name: 'Myles Example' } },
      isPending: false,
    } as any)
    const onOpen = vi.fn()
    window.addEventListener(OPEN_ALIGNMENT_PANEL_EVENT, onOpen)

    render(<DashboardTodayStrip />)
    expect(screen.getByRole('heading', { name: 'Welcome back, Myles' })).toBeInTheDocument()
    expect(screen.getByText('Stage 1')).toBeInTheDocument()
    expect(screen.getByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('0/8')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('dashboard-next-step'))
    expect(onOpen).toHaveBeenCalledTimes(1)
    window.removeEventListener(OPEN_ALIGNMENT_PANEL_EVENT, onOpen)
    await waitFor(() => expect(getAIThreadsFn).toHaveBeenCalled())
  })
})

describe('DashboardPromoBanner', () => {
  it('moves only when the member asks, and wraps around', () => {
    vi.useFakeTimers()
    render(<DashboardPromoBanner />)
    expect(screen.getByText(DASHBOARD_PROMOS[0].title)).toBeInTheDocument()

    vi.advanceTimersByTime(30000)
    expect(screen.getByText(DASHBOARD_PROMOS[0].title)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Next feature'))
    expect(screen.getByText(DASHBOARD_PROMOS[1].title)).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText('Previous feature'))
    fireEvent.click(screen.getByLabelText('Previous feature'))
    expect(screen.getByText(DASHBOARD_PROMOS[DASHBOARD_PROMOS.length - 1].title)).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-promo-position')).toHaveTextContent(`${DASHBOARD_PROMOS.length} / ${DASHBOARD_PROMOS.length}`)
    vi.useRealTimers()
  })

  it('only promotes real pages and never Chitin Gems', () => {
    for (const promo of DASHBOARD_PROMOS) {
      expect(promo.to.startsWith('/')).toBe(true)
      expect(`${promo.title} ${promo.description}`).not.toMatch(/chitin gem|% off|bundle/i)
    }
  })
})

describe('DashboardShortcuts', () => {
  it('renders one link per shortcut', () => {
    render(<DashboardShortcuts />)
    for (const s of DASHBOARD_SHORTCUTS) {
      expect(screen.getByTestId(`dashboard-shortcut-${s.id}`)).toHaveAttribute('href', s.to)
    }
  })
})

describe('Dashboard news and changelog', () => {
  it('links news rows to their article pages and the header to all news', async () => {
    vi.mocked(getBlogPostsFn).mockResolvedValue([
      { slug: 'first-dispatch', title: 'First dispatch: a subtitle', category: 'Doctrine', readTimeMinutes: 4, coverImageUrl: '' },
    ] as any)
    render(<DashboardNewsPanel />)
    await waitFor(() => expect(screen.getByText('First dispatch')).toBeInTheDocument())
    expect(screen.getByText('First dispatch').closest('a')).toHaveAttribute('href', '/news/first-dispatch')
    fireEvent.click(screen.getByRole('button', { name: /all news/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/news' })
  })

  it('lists recent releases as links', () => {
    render(<DashboardChangelogPanel />)
    const links = screen.getAllByRole('link')
    expect(links.length).toBeGreaterThan(0)
    expect(links.length).toBeLessThanOrEqual(5)
    expect(links[0].getAttribute('href')).toMatch(/^\/changelog\//)
  })

  it('formats release days in a fixed time zone', () => {
    expect(formatReleaseDay('2026-10-09T23:30:00Z')).toBe('Oct 9')
    expect(formatReleaseDay('not a date')).toBe('')
  })
})

describe('DashboardEmptyRow', () => {
  it('keeps the title and body as separate text', () => {
    render(<DashboardEmptyRow title="The boards are quiet" body="Open Community to start one." />)
    expect(screen.getByText('The boards are quiet')).toBeInTheDocument()
    expect(screen.getByText('Open Community to start one.')).toBeInTheDocument()
  })
})
