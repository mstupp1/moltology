import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { ActivityStreamPanel } from './ActivityStreamPanel'
import { authClient } from '@/lib/auth-client'
import { getActivityEventsFn } from '@/lib/server/api'
import { ACTIVITY_STREAM_EMPTY_COPY } from '@/lib/activity-events'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c'),
}))

vi.mock('@/lib/server/api', () => ({
  getActivityEventsFn: vi.fn(),
}))

describe('ActivityStreamPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows an honest empty stream for a member with no events', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-empty' } },
      isPending: false,
    } as any)
    vi.mocked(getActivityEventsFn).mockResolvedValue([])

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
    vi.mocked(getActivityEventsFn).mockResolvedValue([
      {
        id: 'evt-1',
        kind: 'routine_completed',
        category: 'ROUTINES',
        title: 'Silent Synchronization sealed',
        detail: 'The 05:30 liturgy is complete.',
        valueBadge: '05:30',
        occurredAt: '2026-08-27T17:46:00.000Z',
        occurredLabel: '14 minutes ago',
      },
    ])

    render(<ActivityStreamPanel />)

    await waitFor(() => {
      expect(screen.getByText('Silent Synchronization sealed')).toBeInTheDocument()
    })
    expect(screen.getByText('The 05:30 liturgy is complete.')).toBeInTheDocument()
    expect(screen.getByText('14 minutes ago')).toBeInTheDocument()
    expect(screen.queryByText(/luxury sedan/i)).not.toBeInTheDocument()
    expect(screen.queryByText(ACTIVITY_STREAM_EMPTY_COPY.title)).not.toBeInTheDocument()
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
    expect(getActivityEventsFn).not.toHaveBeenCalled()
    expect(screen.queryByText(/luxury sedan/i)).not.toBeInTheDocument()
  })
})
