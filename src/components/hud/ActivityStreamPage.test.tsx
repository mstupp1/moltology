import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ActivityStreamPage } from './ActivityStreamPage'
import { authClient } from '@/lib/auth-client'
import { getActivityFeedFn } from '@/lib/server/api'
import {
  ACTIVITY_STREAM_EMPTY_COPY,
  ACTIVITY_STREAM_SELF_EMPTY_COPY,
} from '@/lib/activity-events'
import { clearCachedActivityFeed } from '@/lib/activity-feed-cache'
import type { ActivityEventView } from '@/lib/activity-events'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
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

const streakEvent: ActivityEventView = {
  id: 'evt-streak',
  kind: 'streak_milestone',
  category: 'STREAKS',
  categoryLabel: 'Streak',
  title: '7-day streak',
  detail: 'Held for 7 consecutive days.',
  valueBadge: '7d',
  occurredAt: '2026-08-27T17:46:00.000Z',
  occurredLabel: '14 minutes ago',
  visibility: 'friends',
  href: '/dashboard',
  metadata: { streakDays: 7 },
  actor: {
    id: 'friend-1',
    displayName: 'shell_sib',
    handle: 'shell_sib',
    larvaId: 'LARVA UNIT #2',
    stage: 2,
    avatarConfig: null,
  },
  isOwn: false,
  highlight: true,
}

describe('ActivityStreamPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearCachedActivityFeed()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-real' } },
      isPending: false,
    } as any)
  })

  it('renders circle pulses with actor, kind, and stats', async () => {
    vi.mocked(getActivityFeedFn).mockResolvedValue({
      events: [streakEvent],
      nextCursor: null,
    })

    render(<ActivityStreamPage />)

    await waitFor(() => {
      expect(screen.getByText('7-day streak')).toBeInTheDocument()
    })
    expect(screen.getByText('shell_sib')).toBeInTheDocument()
    expect(screen.getByText('Held for 7 consecutive days.')).toBeInTheDocument()
    expect(screen.getByText('7 days')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Activity Stream' })).toBeInTheDocument()
  })

  it('requests the You slice when that audience is selected', async () => {
    vi.mocked(getActivityFeedFn).mockResolvedValue({ events: [], nextCursor: null })

    render(<ActivityStreamPage />)

    await waitFor(() => {
      expect(getActivityFeedFn).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('tab', { name: 'You' }))

    await waitFor(() => {
      expect(vi.mocked(getActivityFeedFn).mock.calls.some((call) => call[0]?.data?.scope === 'self')).toBe(
        true
      )
    })
    await waitFor(() => {
      expect(screen.getByText(ACTIVITY_STREAM_SELF_EMPTY_COPY.body)).toBeInTheDocument()
    })
  })

  it('loads an earlier page when a cursor is present', async () => {
    vi.mocked(getActivityFeedFn)
      .mockResolvedValueOnce({
        events: [streakEvent],
        nextCursor: '2026-08-27T17:46:00.000Z|evt-streak',
      })
      .mockResolvedValueOnce({
        events: [
          {
            ...streakEvent,
            id: 'evt-older',
            title: '3-day streak',
          },
        ],
        nextCursor: null,
      })

    render(<ActivityStreamPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /show earlier/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /show earlier/i }))
    await waitFor(() => {
      expect(screen.getByText('3-day streak')).toBeInTheDocument()
    })
  })

  it('keeps the empty circle honest', async () => {
    vi.mocked(getActivityFeedFn).mockResolvedValue({ events: [], nextCursor: null })
    render(<ActivityStreamPage />)
    await waitFor(() => {
      expect(screen.getByText(ACTIVITY_STREAM_EMPTY_COPY.title)).toBeInTheDocument()
    })
  })
})
