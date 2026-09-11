import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  ConnectionsHubCard,
  CONNECTIONS_HUB_EMPTY_COPY,
  CONNECTIONS_HUB_TITLE,
  CONNECTIONS_HUB_SEARCH_PLACEHOLDER,
} from './ConnectionsHubCard'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { authClient } from '@/lib/auth-client'
import { listConnectionsFn, searchMembersFn } from '@/lib/server/api'

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
  searchMembersFn: vi.fn(),
  sendFriendRequestFn: vi.fn(),
  respondFriendRequestFn: vi.fn(),
  cancelFriendRequestFn: vi.fn(),
  removeConnectionFn: vi.fn(),
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: () => <div data-testid="avatar" />,
}))

function renderHub() {
  return render(
    <ToastProvider>
      <ConnectionsHubCard />
    </ToastProvider>,
  )
}

describe('ConnectionsHubCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(authClient.useSession).mockReturnValue({
      data: { user: { id: 'user-hub' } },
      isPending: false,
    } as any)
    vi.mocked(searchMembersFn).mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders counts, search, and a quiet empty state when there are no links', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })

    renderHub()

    await waitFor(() => {
      expect(screen.getByText(CONNECTIONS_HUB_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(screen.getByText(CONNECTIONS_HUB_TITLE)).toBeInTheDocument()
    expect(screen.getByText(CONNECTIONS_HUB_EMPTY_COPY.body)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(CONNECTIONS_HUB_SEARCH_PLACEHOLDER)).toBeInTheDocument()
    expect(screen.getByText('Friends')).toBeInTheDocument()
    expect(screen.getByText('Incoming')).toBeInTheDocument()
    expect(screen.getByText('Sent')).toBeInTheDocument()
    expect(screen.getByText('FIND MEMBERS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /open connections/i })).toBeInTheDocument()
  })

  it('renders avatars, incoming actions, sent pending, and friend badges', async () => {
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
          since: new Date().toISOString(),
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
          since: new Date().toISOString(),
        },
      ],
      outgoing: [
        {
          id: 'out-1',
          larvaId: 'LARVA UNIT #7',
          handle: 'sent_one',
          displayName: 'sent_one',
          stage: 2,
          stageLabel: 'Soft-Shed',
          avatarConfig: null,
          requestId: 'req-out',
          since: new Date().toISOString(),
        },
      ],
    })

    renderHub()

    await waitFor(() => {
      expect(screen.getByText('incoming_one')).toBeInTheDocument()
    })
    expect(screen.getByText('sent_one')).toBeInTheDocument()
    expect(screen.getByText('new_claw')).toBeInTheDocument()
    expect(screen.getByText('1 INCOMING')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getAllByText('Friends').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
    expect(screen.getByText('REVIEW REQUESTS')).toBeInTheDocument()
    expect(screen.getAllByTestId('avatar').length).toBeGreaterThanOrEqual(3)
    expect(listConnectionsFn).toHaveBeenCalled()
  })

  it('searches members from the hub without leaving the dashboard', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })
    vi.mocked(searchMembersFn).mockResolvedValue([
      {
        id: 'member-claw',
        larvaId: 'LARVA UNIT #9',
        handle: 'claw_lord',
        displayName: 'claw_lord',
        stage: 2,
        stageLabel: 'Soft-Shed',
        avatarConfig: null,
      },
    ])

    renderHub()

    await waitFor(() => {
      expect(screen.getByLabelText('Search members')).toBeInTheDocument()
    })
    fireEvent.change(screen.getByLabelText('Search members'), { target: { value: 'claw' } })

    await waitFor(() => {
      expect(screen.getByText('claw_lord')).toBeInTheDocument()
    })
    expect(searchMembersFn).toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /add friend/i })).toBeInTheDocument()
    expect(screen.queryByText(CONNECTIONS_HUB_EMPTY_COPY.title)).not.toBeInTheDocument()
  })

  it('shows the empty card for a guest without calling the loader or search', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: null,
      isPending: false,
    } as any)

    renderHub()

    await waitFor(() => {
      expect(screen.getByText(CONNECTIONS_HUB_EMPTY_COPY.title)).toBeInTheDocument()
    })
    expect(listConnectionsFn).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('Search members')).not.toBeInTheDocument()
  })

  it('navigates to connections from the CTA', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })

    renderHub()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open connections/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /open connections/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/connections', search: { tab: 'friends' } })
  })

  it('deep-links the hub CTA and Incoming count into Incoming when a request is pending', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
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
          since: new Date().toISOString(),
        },
      ],
      outgoing: [],
    })

    renderHub()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /open incoming/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /open incoming/i }))
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/connections', search: { tab: 'incoming' } })

    fireEvent.click(screen.getByRole('button', { name: /^incoming/i }))
    expect(mockNavigate).toHaveBeenLastCalledWith({ to: '/connections', search: { tab: 'incoming' } })
  })
})
