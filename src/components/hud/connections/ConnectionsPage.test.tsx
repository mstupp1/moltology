import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import {
  ConnectionsPage,
  CONNECTIONS_INCOMING_EMPTY,
  CONNECTIONS_FRIENDS_EMPTY,
} from './ConnectionsPage'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { listConnectionsFn, respondFriendRequestFn, searchMembersFn } from '@/lib/server/api'

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
    vi.mocked(searchMembersFn).mockResolvedValue([])
    vi.mocked(respondFriendRequestFn).mockResolvedValue({ requestId: 'req-in', status: 'accepted' })
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
})
