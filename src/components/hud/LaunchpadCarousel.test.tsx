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
  it('renders correctly with initial module (Lectures), daily routine, and news feed', () => {
    render(<LaunchpadCarousel />)

    expect(screen.getByText('PORTAL DIRECTIVES')).toBeInTheDocument()
    expect(screen.getByText('MOLT-CYCLE LECTURES')).toBeInTheDocument()
    expect(screen.getByText('RESUME LECTURE (68%)')).toBeInTheDocument()

    // Daily Alignment Section
    expect(screen.getByText('DAILY ALIGNMENT')).toBeInTheDocument()
    expect(screen.getByText('7D STREAK')).toBeInTheDocument()
    expect(screen.getByText('Silent Synchronization')).toBeInTheDocument()

    // MoltNation News Section
    expect(screen.getByText('MOLTNATION NEWS')).toBeInTheDocument()
    expect(screen.getByText('BREAKING')).toBeInTheDocument()
  })

  it('cycles through modules when clicking next/prev buttons', () => {
    render(<LaunchpadCarousel />)

    const nextBtn = screen.getByTitle('Next Directive')
    fireEvent.click(nextBtn)

    // Should switch to Module 2 (Metamorphosis Pipeline)
    expect(screen.getByText('METAMORPHOSIS PIPELINE')).toBeInTheDocument()

    const prevBtn = screen.getByTitle('Previous Directive')
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

  it('navigates to module route when primary CTA button is clicked', () => {
    render(<LaunchpadCarousel />)

    const ctaBtn = screen.getByText('RESUME LECTURE (68%)')
    fireEvent.click(ctaBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/lectures' })
  })

  it('toggles daily alignment tasks when clicked', () => {
    render(<LaunchpadCarousel />)

    const uncompletedTask = screen.getByText('Nutritional Efficiency Break')
    fireEvent.click(uncompletedTask)

    // Task becomes line-through / completed
    expect(uncompletedTask).toHaveClass('line-through')
  })

  it('navigates to news desk when NEWS DESK button is clicked', () => {
    render(<LaunchpadCarousel />)

    const newsDeskBtn = screen.getByText('NEWS DESK')
    fireEvent.click(newsDeskBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/news' })
  })
})
