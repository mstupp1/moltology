import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  ConnectionsHubCard,
  CONNECTIONS_HUB_EMPTY_COPY,
  CONNECTIONS_HUB_TITLE,
} from './ConnectionsHubCard'
import { authClient } from '@/lib/auth-client'
import { listConnectionsFn } from '@/lib/server/api'

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
  listConnectionsFn: vi.fn(),
}))

describe('ConnectionsHubCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-hub' } },
      isPending: false,
    } as any)
  })

  it('renders counts and an empty state when there are no links', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })

    render(<ConnectionsHubCard />)

    await waitFor(() => {
      expect(screen.getByText(CONNECTIONS_HUB_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(screen.getByText(CONNECTIONS_HUB_TITLE)).toBeInTheDocument()
    expect(screen.getByText(CONNECTIONS_HUB_EMPTY_COPY.body)).toBeInTheDocument()
    expect(screen.getByText('Friends')).toBeInTheDocument()
    expect(screen.getByText('Incoming')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open connections/i })).toBeInTheDocument()
  })

  it('renders recent incoming and friend links for a signed-in member', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [
        {
          id: 'friend-1',
          larvaId: 'LARVA UNIT #4',
          handle: 'new_claw',
          displayName: 'new_claw',
          stage: 3,
          stageLabel: 'Exoshell Born',
          avatarConfig: null,
          since: '2026-08-01T00:00:00.000Z',
        },
      ],
      incoming: [
        {
          id: 'in-1',
          larvaId: 'LARVA UNIT #2',
          handle: 'incoming_one',
          displayName: 'incoming_one',
          stage: 1,
          stageLabel: 'Larval Initiate',
          avatarConfig: null,
          requestId: 'req-in',
        },
      ],
      outgoing: [],
    })

    render(<ConnectionsHubCard />)

    await waitFor(() => {
      expect(screen.getByText('incoming_one')).toBeInTheDocument()
    })
    expect(screen.getByText('new_claw')).toBeInTheDocument()
    expect(screen.getAllByText('Incoming').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Friend')).toBeInTheDocument()
    expect(listConnectionsFn).toHaveBeenCalled()
  })

  it('shows the empty card for a guest without calling the loader', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)

    render(<ConnectionsHubCard />)

    await waitFor(() => {
      expect(screen.getByText(CONNECTIONS_HUB_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(listConnectionsFn).not.toHaveBeenCalled()
  })

  it('navigates to connections from the CTA', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })

    render(<ConnectionsHubCard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open connections/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /open connections/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/connections' })
  })
})
