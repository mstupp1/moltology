import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HUDTaskBar } from './HUDTaskBar'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { ACTIVITY_INBOX_LABEL } from '@/lib/notifications'
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
    expect(screen.getByText(/NEXT:/i)).toBeInTheDocument()
  })

  it('does not label the header chip NEXT when all eight liturgies are complete', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(8)} />)

    expect(screen.getByText('8/8')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE')).toBeInTheDocument()
    expect(screen.queryByText(/NEXT:/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Alignment Review')).not.toBeInTheDocument()
  })

  it('points the header chip at the next liturgy while alignment is in progress', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(3)} />)

    expect(screen.getByText('3/8')).toBeInTheDocument()
    expect(screen.getByText(/NEXT:/i)).toBeInTheDocument()
    expect(screen.getByText('Nutritional Efficiency Break')).toBeInTheDocument()
    expect(screen.queryByText('COMPLETE')).not.toBeInTheDocument()
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

  it('toggles the floating schedule dropdown and allows tab switching and spotlight task completion', () => {
    const onComplete = vi.fn()
    render(<HUDTaskBar variant="header" onCompleteTask={onComplete} />)
    
    expect(screen.queryByText('DAILY ALIGNMENT SCHEDULE')).not.toBeInTheDocument()

    const headerClockPill = screen.getByRole('button')
    fireEvent.click(headerClockPill)

    expect(screen.getByText('DAILY ALIGNMENT SCHEDULE')).toBeInTheDocument()
    expect(screen.getAllByText('Silent Synchronization').length).toBeGreaterThan(0)
    expect(screen.getByText('NEXT IMPENDING LITURGY')).toBeInTheDocument()

    // Test Spotlight Complete Button
    const completeBtns = screen.getAllByRole('button', { name: /COMPLETE/i })
    fireEvent.click(completeBtns[0])
    expect(onComplete).toHaveBeenCalledWith('silent-synchronization')

    // Test Tab Switching to ALERTS / TRANSMISSIONS
    const alertsTab = screen.getByText(/ALERTS/i)
    fireEvent.click(alertsTab)
    expect(screen.getByText(ACTIVITY_INBOX_LABEL)).toBeInTheDocument()

    // Switch back to LITURGIES
    const liturgiesTab = screen.getByText(/LITURGIES/i)
    fireEvent.click(liturgiesTab)
    expect(screen.getByText('NEXT IMPENDING LITURGY')).toBeInTheDocument()

    // Close via close activity center button
    const closeBtn = screen.getByRole('button', { name: 'Close activity center' })
    fireEvent.click(closeBtn)

    expect(screen.queryByText('DAILY ALIGNMENT SCHEDULE')).not.toBeInTheDocument()
  })

  it('renders bottom-anchored modal sheet on mobile viewport (< 640px)', () => {
    // Set viewport width to mobile
    act(() => {
      window.innerWidth = 390
      window.dispatchEvent(new Event('resize'))
    })

    render(<HUDTaskBar variant="header" />)

    const headerClockPill = screen.getByRole('button')
    fireEvent.click(headerClockPill)

    // Modal dialog rendered with bottom-anchored modal sheet
    const dialog = screen.getByRole('dialog', { name: 'Activity Center' })
    expect(dialog).toBeInTheDocument()
    expect(dialog.className).toContain('rounded-t-3xl')
    expect(screen.getByLabelText('Drag handle to close')).toBeInTheDocument()
    expect(screen.getByText('DAILY ALIGNMENT SCHEDULE')).toBeInTheDocument()

    // Clean up viewport
    act(() => {
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))
    })
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
    fireEvent.click(screen.getByText(/ALERTS/i))

    expect(screen.getByText(ACTIVITY_INBOX_LABEL)).toBeInTheDocument()
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
