import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HUDTaskBar } from './HUDTaskBar'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { OPEN_ALIGNMENT_PANEL_EVENT } from '@/lib/alignment-panel'
import type { NotificationView } from '@/lib/notifications'

const markRead = vi.fn()
const markAllRead = vi.fn()
let mockNotifications: NotificationView[] = []
let mockUnreadCount = 0

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

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    isLoading: false,
    refresh: vi.fn(),
    markRead,
    markAllRead,
    acceptFriendRequest: vi.fn(),
    declineFriendRequest: vi.fn(),
  }),
}))

function tasksWithCompletedCount(completedCount: number) {
  return CANONICAL_ALIGNMENT_TASKS.map((t, i) => ({
    id: t.key,
    key: t.key,
    time: t.time,
    title: t.title,
    completed: i < completedCount,
  }))
}

describe('HUDTaskBar', () => {
  beforeEach(() => {
    mockNotifications = []
    mockUnreadCount = 0
    markRead.mockReset()
    markAllRead.mockReset()
  })

  it('renders hero task bar chronometer with title, digits, and next alignment task', () => {
    render(<HUDTaskBar variant="hero" />)
    
    expect(screen.getByText('BENTHIC CHRONOMETER')).toBeInTheDocument()
    expect(screen.getByText('NEXT UPCOMING ALIGNMENT TASK')).toBeInTheDocument()
    expect(screen.getByText('Silent Synchronization')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE ALIGNMENT')).toBeInTheDocument()
  })

  it('renders compact header task bar variant correctly', () => {
    render(<HUDTaskBar variant="header" />)
    
    expect(screen.queryByText('BENTHIC CHRONOMETER')).not.toBeInTheDocument()
    expect(screen.getByTestId('header-next')).toHaveTextContent(/^Next /)
  })

  it('does not label the header chip NEXT when all eight liturgies are complete', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(8)} />)

    expect(screen.getByText('8/8')).toBeInTheDocument()
    expect(screen.getByText('All done')).toBeInTheDocument()
    expect(screen.queryByTestId('header-next')).not.toBeInTheDocument()
    expect(screen.queryByText('Alignment Review')).not.toBeInTheDocument()
  })

  it('points the header chip at the next liturgy while alignment is in progress', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(3)} />)

    expect(screen.getByText('3/8')).toBeInTheDocument()
    expect(screen.getByTestId('header-next')).toHaveTextContent(/^Next /)
    expect(screen.getByText('Focus Reset')).toBeInTheDocument()
    expect(screen.queryByText('All done')).not.toBeInTheDocument()
  })

  it('allows switching timezone modes between LOCAL, UTC, BENTHIC, and STARDATE', () => {
    render(<HUDTaskBar variant="hero" />)
    
    const utcButton = screen.getByText('UTC')
    fireEvent.click(utcButton)
    expect(screen.getByText('• ZULU / UTC')).toBeInTheDocument()

    const benthicButton = screen.getByText('BENTHIC')
    fireEvent.click(benthicButton)
    expect(screen.getByText('• BENTHIC CHRONO')).toBeInTheDocument()

    const stardateButton = screen.getByText('STARDATE')
    fireEvent.click(stardateButton)
    expect(screen.getByText('• NEURAL STARDATE')).toBeInTheDocument()
  })

  it('allows toggling 12H / 24H format', () => {
    render(<HUDTaskBar variant="hero" />)
    
    const formatBtn = screen.getByText('24H')
    fireEvent.click(formatBtn)
    expect(screen.getByText('12H')).toBeInTheDocument()
  })

  it('completes the next alignment task when the action button is clicked', () => {
    const onComplete = vi.fn()
    render(<HUDTaskBar variant="hero" onCompleteTask={onComplete} />)
    
    const completeBtn = screen.getByText('COMPLETE ALIGNMENT')
    fireEvent.click(completeBtn)
    expect(onComplete).toHaveBeenCalledWith('silent-synchronization')
  })

  it('toggles the dropdown, switches tabs and toggles liturgies from the list', () => {
    const onComplete = vi.fn()
    render(<HUDTaskBar variant="header" onCompleteTask={onComplete} />)

    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()

    const headerTile = screen.getByRole('button', { name: 'Daily alignment tasks schedule' })
    fireEvent.click(headerTile)

    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tasks/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('0 of 8 done')).toBeInTheDocument()
    expect(screen.getByTestId('alignment-panel')).toHaveTextContent('Next')

    fireEvent.click(screen.getByRole('button', { name: /Silent Synchronization/ }))
    expect(onComplete).toHaveBeenCalledWith('silent-synchronization')

    fireEvent.click(screen.getByRole('tab', { name: /Alerts/ }))
    expect(screen.getByText('Nothing new')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Tasks/ }))
    expect(screen.getByText('0 of 8 done')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Close activity center' }))
    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()
  })

  it('shows every liturgy without the old spotlight card, chips or bracketed times', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(3)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))

    const panel = screen.getByTestId('alignment-panel')
    expect(panel.querySelectorAll('li')).toHaveLength(8)
    expect(screen.queryByText('NEXT IMPENDING LITURGY')).not.toBeInTheDocument()
    expect(screen.queryByText('PENDING')).not.toBeInTheDocument()
    expect(panel.textContent).not.toContain('[')
    expect(screen.queryByRole('switch', { name: /Reminders/ })).not.toBeInTheDocument()
  })

  it('marks the header tile with the unread count', () => {
    mockUnreadCount = 2
    render(<HUDTaskBar variant="header" />)

    expect(screen.getByLabelText('2 new alerts')).toHaveTextContent('2')
  })

  it('renders bottom-anchored modal sheet on mobile viewport (< 640px)', () => {
    // Set viewport width to mobile
    act(() => {
      window.innerWidth = 390
      window.dispatchEvent(new Event('resize'))
    })

    render(<HUDTaskBar variant="header" />)

    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))

    // Modal dialog rendered with bottom-anchored modal sheet
    const dialog = screen.getByRole('dialog', { name: "Today's tasks and alerts" })
    expect(dialog).toBeInTheDocument()
    expect(dialog.className).toContain('rounded-t-3xl')
    expect(screen.getByLabelText('Drag handle to close')).toBeInTheDocument()
    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()

    // Clean up viewport
    act(() => {
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))
    })
  })

  it('keeps the phone sheet open while switching between Tasks and Alerts', () => {
    act(() => {
      window.innerWidth = 390
      window.dispatchEvent(new Event('resize'))
    })

    render(<HUDTaskBar variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))

    const alertsTab = screen.getByRole('tab', { name: /Alerts/ })
    fireEvent.mouseDown(alertsTab)
    fireEvent.click(alertsTab)
    expect(screen.getByText('Nothing new')).toBeInTheDocument()

    const tasksTab = screen.getByRole('tab', { name: /Tasks/ })
    fireEvent.mouseDown(tasksTab)
    fireEvent.click(tasksTab)
    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()
    expect(tasksTab).toHaveAttribute('aria-selected', 'true')

    act(() => {
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))
    })
  })

  it('closes the desktop dropdown on a click outside it', () => {
    render(<HUDTaskBar variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))

    fireEvent.mouseDown(screen.getByRole('tab', { name: /Alerts/ }))
    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()

    fireEvent.mouseDown(document.body)
    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()
  })

  it('opens the liturgies panel when the dashboard alignment card event fires', () => {
    render(<HUDTaskBar variant="header" />)

    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new CustomEvent(OPEN_ALIGNMENT_PANEL_EVENT))
    })

    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Tasks/ })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Daily alignment tasks schedule' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('lists hail and reply transmissions with thread deep-links and marks them read', () => {
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

    render(<HUDTaskBar variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))
    fireEvent.click(screen.getByRole('tab', { name: /Alerts/ }))

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
