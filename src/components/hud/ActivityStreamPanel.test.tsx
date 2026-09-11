import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ActivityStreamPanel } from './ActivityStreamPanel'
import { authClient } from '@/lib/auth-client'
import { getActivityFeedFn } from '@/lib/server/api'
import { ACTIVITY_STREAM_EMPTY_COPY } from '@/lib/activity-events'
import type { ActivityEventView } from '@/lib/activity-events'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, params, ...props }: any) => (
    <a href={typeof to === 'string' ? `${to}/${params?.profileId ?? ''}` : '/member'} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/lib/server/api', () => ({
  getActivityFeedFn: vi.fn(),
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: () => <div data-testid="avatar" />,
}))

function sampleEvent(overrides: Partial<ActivityEventView> = {}): ActivityEventView {
  return {
    id: 'evt-1',
    kind: 'routine_completed',
    category: 'ROUTINES',
    categoryLabel: 'Liturgy',
    title: 'Silent Synchronization sealed',
    detail: 'The 05:30 liturgy is complete.',
    valueBadge: '05:30',
    occurredAt: '2026-08-27T17:46:00.000Z',
    occurredLabel: '14 minutes ago',
    visibility: 'friends',
    href: '/dashboard',
    metadata: { time: '05:30' },
    actor: {
      id: 'user-real',
      displayName: 'claw_lord',
      handle: 'claw_lord',
      larvaId: 'LARVA UNIT #1',
      stage: 1,
      avatarConfig: null,
    },
    isOwn: true,
    highlight: false,
    ...overrides,
  }
}

describe('ActivityStreamPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an honest empty stream for a member with no events', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-empty' } },
      isPending: false,
    } as any)
    vi.mocked(getActivityFeedFn).mockResolvedValue({ events: [], nextCursor: null })

    render(<ActivityStreamPanel />)

    await waitFor(() => {
      expect(screen.getByText(ACTIVITY_STREAM_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(screen.getByText(ACTIVITY_STREAM_EMPTY_COPY.body)).toBeInTheDocument()
    expect(screen.queryByText(/luxury sedan/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\+450/)).not.toBeInTheDocument()
    expect(screen.queryByText(/3,?400/)).not.toBeInTheDocument()
    expect(screen.queryByText(/pincer torque/i)).not.toBeInTheDocument()
  })

  it('renders a real liturgy event returned for the signed-in member', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-real' } },
      isPending: false,
    } as any)
    vi.mocked(getActivityFeedFn).mockResolvedValue({
      events: [sampleEvent()],
      nextCursor: null,
    })

    render(<ActivityStreamPanel />)

    await waitFor(() => {
      expect(screen.getByText('Silent Synchronization sealed')).toBeInTheDocument()
    })
    expect(screen.getByText('The 05:30 liturgy is complete.')).toBeInTheDocument()
    expect(screen.getByText('14 minutes ago')).toBeInTheDocument()
    expect(screen.queryByText(/luxury sedan/i)).not.toBeInTheDocument()
    expect(screen.queryByText(ACTIVITY_STREAM_EMPTY_COPY.title)).not.toBeInTheDocument()
  })

  it('opens the dedicated stream route from the hub footer', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-real' } },
      isPending: false,
    } as any)
    vi.mocked(getActivityFeedFn).mockResolvedValue({ events: [], nextCursor: null })

    render(<ActivityStreamPanel />)

    await waitFor(() => {
      expect(screen.getByText(ACTIVITY_STREAM_EMPTY_COPY.title)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /open stream/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/stream' })
    fireEvent.click(screen.getByRole('heading', { name: /activity stream/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/stream' })
  })

  it('shows the empty stream for a guest instead of canned veteran proof', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)

    render(<ActivityStreamPanel />)

    await waitFor(() => {
      expect(screen.getByText(ACTIVITY_STREAM_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(getActivityFeedFn).not.toHaveBeenCalled()
    expect(screen.queryByText(/luxury sedan/i)).not.toBeInTheDocument()
  })
})
