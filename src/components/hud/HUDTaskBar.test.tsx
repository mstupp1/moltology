import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HUDTaskBar } from './HUDTaskBar'
import { CANONICAL_ALIGNMENT_TASKS } from '@/lib/alignment-tasks'

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
    expect(screen.getByText('FRIEND REQUESTS & ALERTS')).toBeInTheDocument()

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
})
