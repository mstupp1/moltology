import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  ConnectionsPage,
  CONNECTIONS_INCOMING_EMPTY,
  CONNECTIONS_FRIENDS_EMPTY,
} from './ConnectionsPage'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { listConnectionsFn, respondFriendRequestFn, searchMembersFn, sendFriendRequestFn, dismissSynapticNearbyFn } from '@/lib/server/api'
import {
  SYNAPTIC_NEARBY_DISMISS_LABEL,
  SYNAPTIC_NEARBY_TITLE,
} from '@/lib/connections'

const onTabChange = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, ...props }: any) => (
    <a href={typeof to === 'string' ? `${to}/${params?.profileId ?? ''}` : '/member'} {...props}>
      {children}
    </a>
  ),
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
  dismissSynapticNearbyFn: vi.fn(),
}))

vi.mock('@/components/hud/LobsterAvatarPortrait', () => ({
  LobsterAvatarPortrait: () => <div data-testid="avatar" />,
}))

const incomingMember = {
  id: 'in-1',
  larvaId: 'LARVA UNIT #2',
  handle: 'incoming_one',
  displayName: 'incoming_one',
  stage: 1,
  stageLabel: 'Larval Initiate',
  avatarConfig: null,
  requestId: 'req-in',
  since: new Date().toISOString(),
}

function renderPage(tab?: 'friends' | 'incoming' | 'sent') {
  return render(
    <ToastProvider>
      <ConnectionsPage tab={tab} onTabChange={onTabChange} />
    </ToastProvider>,
  )
}

describe('ConnectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(listConnectionsFn).mockReset()
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
      suggested: [],
    })
    vi.mocked(searchMembersFn).mockResolvedValue([])
    vi.mocked(respondFriendRequestFn).mockResolvedValue({ requestId: 'req-in', status: 'accepted' })
    vi.mocked(sendFriendRequestFn).mockResolvedValue({ requestId: 'req-out', status: 'pending' })
    vi.mocked(dismissSynapticNearbyFn).mockResolvedValue({ ok: true })
  })

  it('keeps Incoming empty-honest when nothing is pending', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
    })

    renderPage('incoming')

    await waitFor(() => {
      expect(screen.getByText(CONNECTIONS_INCOMING_EMPTY)).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
    expect(screen.queryByText(CONNECTIONS_FRIENDS_EMPTY)).not.toBeInTheDocument()
  })

  it('opens Incoming with accept and decline when a request is pending', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [incomingMember],
      outgoing: [],
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText('incoming_one')).toBeInTheDocument()
    })
    expect(screen.getByText('Incoming request')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
    expect(screen.queryByText(CONNECTIONS_INCOMING_EMPTY)).not.toBeInTheDocument()
  })

  it('accepts an incoming request through the existing respond API', async () => {
    vi.mocked(listConnectionsFn)
      .mockResolvedValueOnce({
        friends: [],
        incoming: [incomingMember],
        outgoing: [],
      })
      .mockResolvedValueOnce({
        friends: [
          {
            ...incomingMember,
            requestId: undefined,
          },
        ],
        incoming: [],
        outgoing: [],
      })

    renderPage('incoming')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))

    await waitFor(() => {
      expect(respondFriendRequestFn).toHaveBeenCalledWith({
        data: { requestId: 'req-in', action: 'accept', token: 'a.b.c' },
      })
    })
  })

  it('declines an incoming request through the existing respond API', async () => {
    vi.mocked(listConnectionsFn)
      .mockResolvedValueOnce({
        friends: [],
        incoming: [incomingMember],
        outgoing: [],
      })
      .mockResolvedValueOnce({
        friends: [],
        incoming: [],
        outgoing: [],
      })
    vi.mocked(respondFriendRequestFn).mockResolvedValue({ requestId: 'req-in', status: 'rejected' })

    renderPage('incoming')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /decline/i }))

    await waitFor(() => {
      expect(respondFriendRequestFn).toHaveBeenCalledWith({
        data: { requestId: 'req-in', action: 'reject', token: 'a.b.c' },
      })
    })
  })

  it('reports the Incoming tab when the member chooses it', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [incomingMember],
      outgoing: [],
    })

    renderPage('friends')

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /incoming/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /incoming/i }))
    expect(onTabChange).toHaveBeenCalledWith('incoming')
  })

  const nearbyMember = {
    id: 'near-1',
    larvaId: 'LARVA UNIT #9',
    handle: 'probe_alpha',
    displayName: 'probe_alpha',
    stage: 1,
    stageLabel: 'Larval Initiate',
    avatarConfig: null,
  }

  it('loads Synaptic nearby once on mount and hides the strip when nobody is eligible', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
      suggested: [],
    })

    renderPage('friends')

    await waitFor(() => {
      expect(listConnectionsFn).toHaveBeenCalledWith({
        data: { token: 'a.b.c', includeSuggestions: true },
      })
    })
    expect(screen.queryByText(SYNAPTIC_NEARBY_TITLE)).not.toBeInTheDocument()
    expect(listConnectionsFn).toHaveBeenCalledTimes(1)
  })

  it('renders nearby cards that are not already friends and caps the strip at five', async () => {
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
      suggested: Array.from({ length: 6 }, (_, i) => ({
        ...nearbyMember,
        id: `near-${i + 1}`,
        handle: `initiate_${i + 1}`,
        displayName: `initiate_${i + 1}`,
      })),
    })

    renderPage('friends')

    await waitFor(() => {
      expect(screen.getByText(SYNAPTIC_NEARBY_TITLE)).toBeInTheDocument()
    })
    expect(screen.getByText('initiate_1')).toBeInTheDocument()
    expect(screen.getByText('initiate_5')).toBeInTheDocument()
    expect(screen.queryByText('initiate_6')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /add friend/i })).toHaveLength(5)
  })

  it('sends a friend request from a nearby card through the existing request path', async () => {
    vi.mocked(sendFriendRequestFn).mockResolvedValue({ requestId: 'req-out', status: 'pending' })
    vi.mocked(listConnectionsFn)
      .mockResolvedValueOnce({
        friends: [],
        incoming: [],
        outgoing: [],
        suggested: [nearbyMember],
      })
      .mockResolvedValue({
        friends: [],
        incoming: [],
        outgoing: [{ ...nearbyMember, requestId: 'req-out' }],
        suggested: [],
      })

    renderPage('friends')

    await waitFor(() => {
      expect(screen.getByText('probe_alpha')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /add friend/i }))

    await waitFor(() => {
      expect(sendFriendRequestFn).toHaveBeenCalledWith({
        data: { recipientId: 'near-1', token: 'a.b.c' },
      })
    })
    await waitFor(() => {
      expect(screen.getByText('Friend request sent.')).toBeInTheDocument()
    })
    expect(screen.queryByText(SYNAPTIC_NEARBY_TITLE)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sent/i })).toHaveTextContent('1')
  })

  it('hides a nearby card when dismissed and persists the hide', async () => {
    vi.mocked(dismissSynapticNearbyFn).mockResolvedValue({ ok: true })
    vi.mocked(listConnectionsFn).mockResolvedValue({
      friends: [],
      incoming: [],
      outgoing: [],
      suggested: [nearbyMember],
    })

    renderPage('friends')

    await waitFor(() => {
      expect(screen.getByText('probe_alpha')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: SYNAPTIC_NEARBY_DISMISS_LABEL }))

    await waitFor(() => {
      expect(dismissSynapticNearbyFn).toHaveBeenCalledWith({
        data: { memberId: 'near-1', token: 'a.b.c' },
      })
    })
    expect(screen.queryByText('probe_alpha')).not.toBeInTheDocument()
    expect(screen.queryByText(SYNAPTIC_NEARBY_TITLE)).not.toBeInTheDocument()
  })
})
