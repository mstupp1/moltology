import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DigitalClock } from './DigitalClock'

describe('DigitalClock', () => {
  it('renders hero digital clock with title, digits, and next alignment task', () => {
    render(<DigitalClock variant="hero" />)
    
    expect(screen.getByText('BENTHIC CHRONOMETER')).toBeInTheDocument()
    expect(screen.getByText('NEXT UPCOMING ALIGNMENT TASK')).toBeInTheDocument()
    expect(screen.getByText('Nutritional Efficiency Break')).toBeInTheDocument()
    expect(screen.getByText('COMPLETE ALIGNMENT')).toBeInTheDocument()
  })

  it('renders compact clock header variant correctly', () => {
    render(<DigitalClock variant="header" />)
    
    expect(screen.queryByText('BENTHIC CHRONOMETER')).not.toBeInTheDocument()
    expect(screen.getByText(/NEXT:/i)).toBeInTheDocument()
  })

  it('allows switching timezone modes between LOCAL, UTC, BENTHIC, and STARDATE', () => {
    render(<DigitalClock variant="hero" />)
    
    const utcButton = screen.getByText('UTC')
    fireEvent.click(utcButton)
    expect(screen.getByText('ZULU / UTC')).toBeInTheDocument()

    const benthicButton = screen.getByText('BENTHIC')
    fireEvent.click(benthicButton)
    expect(screen.getByText('BENTHIC CHRONO')).toBeInTheDocument()

    const stardateButton = screen.getByText('STARDATE')
    fireEvent.click(stardateButton)
    expect(screen.getByText('NEURAL STARDATE')).toBeInTheDocument()
  })

  it('allows toggling 12H / 24H format', () => {
    render(<DigitalClock variant="hero" />)
    
    const formatBtn = screen.getByText('24H')
    fireEvent.click(formatBtn)
    expect(screen.getByText('12H')).toBeInTheDocument()
  })

  it('completes the next alignment task when the action button is clicked', () => {
    const onComplete = vi.fn()
    render(<DigitalClock variant="hero" onCompleteTask={onComplete} />)
    
    const completeBtn = screen.getByText('COMPLETE ALIGNMENT')
    fireEvent.click(completeBtn)
    expect(onComplete).toHaveBeenCalledWith('4') // task id '4' is Nutritional Efficiency Break
  })

  it('toggles the floating schedule dropdown when clicking on top bar header clock', () => {
    render(<DigitalClock variant="header" />)
    
    expect(screen.queryByText('DAILY ALIGNMENT SCHEDULE')).not.toBeInTheDocument()

    const headerClockPill = screen.getByRole('button')
    fireEvent.click(headerClockPill)

    expect(screen.getByText('DAILY ALIGNMENT SCHEDULE')).toBeInTheDocument()
    expect(screen.getByText('Silent Synchronization')).toBeInTheDocument()
    expect(screen.getByText('Alignment Review')).toBeInTheDocument()

    const closeBtn = screen.getByText('CLOSE SCHEDULE ✕')
    fireEvent.click(closeBtn)

    expect(screen.queryByText('DAILY ALIGNMENT SCHEDULE')).not.toBeInTheDocument()
  })
})
