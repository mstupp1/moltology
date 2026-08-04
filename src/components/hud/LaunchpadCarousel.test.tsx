import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LaunchpadCarousel, LAUNCHPAD_MODULES } from './LaunchpadCarousel'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('LaunchpadCarousel Component', () => {
  it('renders correctly with initial module (Lectures)', () => {
    render(<LaunchpadCarousel />)

    expect(screen.getByText('TELEMETRY LAUNCHPAD & PORTAL DIRECTIVES')).toBeInTheDocument()
    expect(screen.getByText('MOLT-CYCLE LECTURES')).toBeInTheDocument()
    expect(screen.getByText('RESUME LECTURE (68%)')).toBeInTheDocument()
    expect(screen.getByText('RELATED SUB-MODULES & EXPANSIONS')).toBeInTheDocument()
  })

  it('cycles through modules when clicking next/prev buttons', () => {
    render(<LaunchpadCarousel />)

    const nextBtn = screen.getByTitle('Next Module')
    fireEvent.click(nextBtn)

    // Should switch to Module 2 (Moltology Science)
    expect(screen.getByText('MOLTOLOGY SCIENCE & PIPELINE')).toBeInTheDocument()

    const prevBtn = screen.getByTitle('Previous Module')
    fireEvent.click(prevBtn)

    // Should switch back to Module 1 (Lectures)
    expect(screen.getByText('MOLT-CYCLE LECTURES')).toBeInTheDocument()
  })

  it('allows direct module selection via bottom thumbnail tabs', () => {
    render(<LaunchpadCarousel />)

    // Click on tab index 2 (The Benthic Market)
    const marketTab = screen.getByText('03. market')
    fireEvent.click(marketTab)

    expect(screen.getByText('THE BENTHIC MARKET')).toBeInTheDocument()
    expect(screen.getByText('OPEN MARKET VAULT')).toBeInTheDocument()
  })

  it('opens related sub-item modal when clicking a sub-module tile', () => {
    render(<LaunchpadCarousel />)

    const subItemTile = screen.getByText('Neural Resonance Transcripts')
    fireEvent.click(subItemTile)

    // Modal should pop up
    expect(screen.getByText('DEPLOYMENT STATUS:')).toBeInTheDocument()
    expect(screen.getAllByText('High-frequency auditory stream for subconscious chitin alignment.').length).toBeGreaterThan(0)

    // Close modal
    const closeBtn = screen.getByText('CLOSE')
    fireEvent.click(closeBtn)


    expect(screen.queryByText('DEPLOYMENT STATUS:')).not.toBeInTheDocument()
  })

  it('navigates to module route when primary CTA button is clicked', () => {
    render(<LaunchpadCarousel />)

    const ctaBtn = screen.getByText('RESUME LECTURE (68%)')
    fireEvent.click(ctaBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/lectures' })
  })
})
