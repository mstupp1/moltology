import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HUDTaskBar } from './HUDTaskBar'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'
import { OPEN_ALIGNMENT_PANEL_EVENT } from '@/lib/alignment-panel'

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
  it('renders hero task bar chronometer with title, digits, and next alignment task', () => {
    render(<HUDTaskBar variant="hero" />)
    
    expect(screen.getByText('BENTHIC CHRONOMETER')).toBeInTheDocument()
    expect(screen.getByText('NEXT UPCOMING ALIGNMENT TASK')).toBeInTheDocument()
    expect(screen.getByText('Silent Synchronization')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE ALIGNMENT')).toBeInTheDocument()
  })

  it('renders the phone top bar ring instead of the chronometer', () => {
    render(<HUDTaskBar variant="header" />)

    expect(screen.queryByText('BENTHIC CHRONOMETER')).not.toBeInTheDocument()
    expect(screen.getByTestId('alignment-ring')).toBeInTheDocument()
  })

  it('shows the full count in the ring when all eight liturgies are complete', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(8)} />)

    expect(screen.getByTestId('header-count')).toHaveTextContent('8/8')
    expect(screen.queryByText('Close the day')).not.toBeInTheDocument()
  })

  it('shows the done count in the ring while alignment is in progress', () => {
    render(<HUDTaskBar variant="header" tasks={tasksWithCompletedCount(3)} />)

    expect(screen.getByTestId('header-count')).toHaveTextContent('3/8')
    expect(screen.getByLabelText('Daily alignment tasks schedule')).toHaveAttribute('aria-description', '3 of 8 done today')
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

  it('toggles the dropdown and toggles liturgies from the list', () => {
    const onComplete = vi.fn()
    render(<HUDTaskBar variant="header" onCompleteTask={onComplete} />)

    expect(screen.queryByTestId('alignment-panel')).not.toBeInTheDocument()

    const headerTile = screen.getByRole('button', { name: 'Daily alignment tasks schedule' })
    fireEvent.click(headerTile)

    expect(screen.getByTestId('alignment-panel')).toBeInTheDocument()
    expect(screen.getByText('0 of 8 done')).toBeInTheDocument()
    expect(screen.getByTestId('alignment-panel')).toHaveTextContent('Next')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Silent Synchronization/ }))
    expect(onComplete).toHaveBeenCalledWith('silent-synchronization')

    fireEvent.click(screen.getByRole('button', { name: "Close today's tasks" }))
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

  it('renders bottom-anchored modal sheet on mobile viewport (< 640px)', () => {
    // Set viewport width to mobile
    act(() => {
      window.innerWidth = 390
      window.dispatchEvent(new Event('resize'))
    })

    render(<HUDTaskBar variant="header" />)

    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))

    // Modal dialog rendered with bottom-anchored modal sheet
    const dialog = screen.getByRole('dialog', { name: "Today's tasks" })
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

  it('closes the desktop dropdown on a click outside it', () => {
    render(<HUDTaskBar variant="header" />)
    fireEvent.click(screen.getByRole('button', { name: 'Daily alignment tasks schedule' }))

    fireEvent.mouseDown(screen.getByRole('button', { name: /Silent Synchronization/ }))
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
    expect(screen.getByRole('button', { name: 'Daily alignment tasks schedule' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

})
