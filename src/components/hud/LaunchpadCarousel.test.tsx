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
    expect(screen.getByText(/STREAK/i)).toBeInTheDocument()
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

  it('toggles daily alignment tasks when clicked and renders all items in scrollable list', () => {
    render(<LaunchpadCarousel />)

    // Check that items throughout the full list are present
    expect(screen.getByText('Silent Synchronization')).toBeInTheDocument()
    expect(screen.getByText('Iterative Refinement')).toBeInTheDocument()
    expect(screen.getByText('Alignment Review')).toBeInTheDocument()

    const uncompletedTask = screen.getByText('Nutritional Efficiency Break')
    fireEvent.click(uncompletedTask)

    // Task becomes line-through / completed
    expect(uncompletedTask).toHaveClass('line-through')
  })

  it('navigates to news desk when VIEW MORE ON MOLTNATION NEWS button is clicked', () => {
    render(<LaunchpadCarousel />)

    const viewMoreBtn = screen.getByText('VIEW MORE ON MOLTNATION NEWS')
    fireEvent.click(viewMoreBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/news' })
  })

  it('renders featured news article card with smooth fade key and periodic counter', () => {
    render(<LaunchpadCarousel />)

    // Initial featured badge and headline
    expect(screen.getByText('FEATURED 01')).toBeInTheDocument()
    expect(screen.getByText('The 2026 Moltmaxxing Protocol')).toBeInTheDocument()
    expect(screen.getByText('READ ARTICLE')).toBeInTheDocument()
  })

  it('opens reader modal with parsed markdown when clicking featured news card, and closes it', () => {
    render(<LaunchpadCarousel />)

    // Click on the featured news card
    const readArticleBtn = screen.getByText('READ ARTICLE')
    fireEvent.click(readArticleBtn)

    // Modal reader should be open with close button and markdown content
    const closeBtn = screen.getByTitle('Close Modal')
    expect(closeBtn).toBeInTheDocument()
    expect(screen.getByText('FULL DESK PAGE')).toBeInTheDocument()

    // Close modal
    fireEvent.click(closeBtn)
    expect(screen.queryByTitle('Close Modal')).not.toBeInTheDocument()
  })

  it('opens reader modal when clicking a wire article from the scrollable list', () => {
    render(<LaunchpadCarousel />)

    // Find wire articles list header
    expect(screen.getByText(/WIRE ARTICLES/i)).toBeInTheDocument()

    // Click on a wire article item (h5 heading)
    const wireArticle = screen.getByRole('heading', { level: 5, name: /From Prompt Engineering to Bio-Silicon Cognition/i })
    fireEvent.click(wireArticle)

    // Modal reader should open
    expect(screen.getByTitle('Close Modal')).toBeInTheDocument()
  })
})
