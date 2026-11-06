import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { NotificationsBell } from './NotificationsBell'
import type { NotificationView } from '@/lib/notifications'

const markRead = vi.fn()
const markAllRead = vi.fn()
const refresh = vi.fn()
const acceptFriendRequest = vi.fn()
let mockNotifications: NotificationView[] = []
let mockUnreadCount = 0
let mockUser: { id: string } | null = { id: 'me' }

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, params, hash, ...props }: any) => {
    const href =
      to === '/forum/$categorySlug/$topicSlug'
        ? `/forum/${params?.categorySlug}/${params?.topicSlug}${hash ? `#${hash}` : ''}`
        : to
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  },
}))

vi.mock('@/hooks/useAuthSession', () => ({
  useAuthSession: () => ({ user: mockUser }),
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    isLoading: false,
    refresh,
    markRead,
    markAllRead,
    acceptFriendRequest,
    declineFriendRequest: vi.fn(),
  }),
}))

const friendRequest: NotificationView = {
  id: 'n-friend',
  kind: 'friend_request',
  title: 'Friend request',
  detail: 'claw_lord wants to connect.',
  actorUserId: 'actor-1',
  actorLarvaId: null,
  actorHandle: 'claw_lord',
  payload: { requestId: 'req-1', profileId: 'actor-1' },
  readAt: null,
  createdAt: '2026-09-06T01:00:00.000Z',
  actionable: true,
}

describe('NotificationsBell', () => {
  beforeEach(() => {
    mockNotifications = []
    mockUnreadCount = 0
    mockUser = { id: 'me' }
    markRead.mockReset()
    markAllRead.mockReset()
    refresh.mockReset()
    acceptFriendRequest.mockReset()
  })

  it('renders nothing for guests', () => {
    mockUser = null
    const { container } = render(<NotificationsBell variant="sidebar" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the unread count on the sidebar row and asks for a fresh read when opened', () => {
    mockUnreadCount = 3
    render(<NotificationsBell variant="sidebar" />)
    const row = screen.getByRole('button', { name: 'Notifications, 3 new' })
    expect(row).toHaveTextContent('Notifications')
    expect(row).toHaveTextContent('3')

    fireEvent.click(row)
    expect(refresh).toHaveBeenCalledWith({ force: true })
    expect(screen.getByTestId('notifications-panel')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mark all read' })).toBeInTheDocument()
  })

  it('shows an empty state and closes on an outside click', () => {
    render(<NotificationsBell variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByText('Nothing new')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('notifications-panel')).not.toBeInTheDocument()
  })

  it('lets members answer friend requests from the panel', () => {
    mockNotifications = [friendRequest]
    mockUnreadCount = 1
    render(<NotificationsBell variant="sidebar" />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 1 new' }))

    expect(screen.getByText('Needs you')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    expect(acceptFriendRequest).toHaveBeenCalledWith('req-1', 'n-friend')
    expect(screen.getByRole('link', { name: 'View profile' })).toHaveAttribute('href', '/member/$profileId')
  })

  it('opens as a bottom sheet on phones', () => {
    act(() => {
      window.innerWidth = 390
      window.dispatchEvent(new Event('resize'))
    })
    render(<NotificationsBell variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument()
    expect(screen.getByTestId('notifications-panel')).toBeInTheDocument()
    act(() => {
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))
    })
  })

  it('lists mentions and replies with thread deep-links and marks them read', () => {
    mockNotifications = [
      {
        id: 'n-hail',
        kind: 'forum_mention',
        title: 'You were hailed',
        detail: 'claw_lord hailed you in a discussion.',
        actorUserId: 'actor-1',
        actorLarvaId: null,
        actorHandle: 'claw_lord',
        payload: {
          categorySlug: 'general-discussion',
          topicSlug: 'molt-notes',
          postId: 'post-hail',
        },
        readAt: null,
        createdAt: '2026-09-06T01:00:00.000Z',
        actionable: false,
      },
      {
        id: 'n-reply',
        kind: 'forum_reply',
        title: 'A reply reached your thread',
        detail: 'pincer_prime answered a thread you opened.',
        actorUserId: 'actor-2',
        actorLarvaId: null,
        actorHandle: 'pincer_prime',
        payload: {
          categorySlug: 'general-discussion',
          topicSlug: 'molt-notes',
          postId: 'post-reply',
          replyTarget: 'topic',
        },
        readAt: null,
        createdAt: '2026-09-06T00:00:00.000Z',
        actionable: false,
      },
    ]
    mockUnreadCount = 2

    render(<NotificationsBell variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications, 2 new' }))

    expect(screen.getByText('Recent')).toBeInTheDocument()
    expect(screen.getByText('You were hailed')).toBeInTheDocument()
    expect(screen.getByText('A reply reached your thread')).toBeInTheDocument()

    const hailLink = screen.getByRole('link', { name: /You were hailed/i })
    expect(hailLink).toHaveAttribute(
      'href',
      '/forum/general-discussion/molt-notes#post-post-hail',
    )
    const replyLink = screen.getByRole('link', { name: /A reply reached your thread/i })
    expect(replyLink).toHaveAttribute(
      'href',
      '/forum/general-discussion/molt-notes#post-post-reply',
    )

    fireEvent.click(hailLink)
    expect(markRead).toHaveBeenCalledWith('n-hail')
  })
})
