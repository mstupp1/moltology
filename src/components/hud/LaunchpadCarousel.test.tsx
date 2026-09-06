import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LaunchpadCarousel, LAUNCHPAD_MODULES } from './LaunchpadCarousel'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('LaunchpadCarousel Component', () => {
  it('renders correctly with initial module and news feed', () => {
    render(<LaunchpadCarousel />)

    expect(screen.getByText('FEATURED MODULES')).toBeInTheDocument()
    expect(screen.getByText('MOLT-CYCLE LECTURES')).toBeInTheDocument()
    expect(screen.getByText('RESUME LECTURE (68%)')).toBeInTheDocument()

    // MoltNation News Section
    expect(screen.getByText('MOLTNATION NEWS')).toBeInTheDocument()
    expect(screen.queryByText('BREAKING')).not.toBeInTheDocument()
    expect(screen.queryByText('LIVE')).not.toBeInTheDocument()
    expect(screen.queryByText('DAILY ALIGNMENT')).not.toBeInTheDocument()
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
    const marketTab = screen.getByText('market')
    fireEvent.click(marketTab)

    expect(screen.getByText('THE BENTHIC MARKET')).toBeInTheDocument()
    expect(screen.getByText('OPEN MARKET VAULT')).toBeInTheDocument()
  })

  it('includes 6 launchpad modules with Oracle as the 6th directive', () => {
    expect(LAUNCHPAD_MODULES).toHaveLength(6)
    expect(LAUNCHPAD_MODULES[5].id).toBe('oracle')
    expect(LAUNCHPAD_MODULES[5].title).toBe('SYNAPTIC ORACLE')
    expect(LAUNCHPAD_MODULES[5].route).toBe('/oracle')
    expect(LAUNCHPAD_MODULES[5].ctaText).toBe('CONSULT ORACLE')
  })

  it('allows selecting the 6th oracle directive and navigates to /oracle', () => {
    render(<LaunchpadCarousel />)

    const oracleTab = screen.getByText('oracle')
    fireEvent.click(oracleTab)

    expect(screen.getByText('SYNAPTIC ORACLE')).toBeInTheDocument()
    const ctaBtn = screen.getByText('CONSULT ORACLE')
    expect(ctaBtn).toBeInTheDocument()

    fireEvent.click(ctaBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/oracle' })
  })

  it('does not render top telemetry header row (pause/play button or counter in header) on the directives card', () => {
    render(<LaunchpadCarousel />)

    const directivesSection = screen.getByLabelText('Featured Modules')
    expect(within(directivesSection).queryByTitle('Pause Auto-advance')).not.toBeInTheDocument()
    expect(within(directivesSection).queryByTitle('Enable Auto-advance')).not.toBeInTheDocument()
    expect(within(directivesSection).queryByText(/01 \/ 06/)).not.toBeInTheDocument()
  })

  it('navigates to module route when primary CTA button is clicked', () => {
    render(<LaunchpadCarousel />)

    const ctaBtn = screen.getByText('RESUME LECTURE (68%)')
    fireEvent.click(ctaBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/lectures' })
  })

  it('navigates to news desk when VIEW MORE ON MOLTNATION NEWS button is clicked', () => {
    render(<LaunchpadCarousel />)

    const viewMoreBtn = screen.getByText('VIEW MORE ON MOLTNATION NEWS')
    fireEvent.click(viewMoreBtn)

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/news' })
  })

  it('caps MoltNation News panel height on mobile below desktop bento height', () => {
    render(<LaunchpadCarousel />)

    const panel = screen.getByTestId('moltnation-news-panel')
    const column = panel.parentElement
    expect(column).not.toBeNull()
    expect(column!.className).toMatch(/h-\[700px]/)
    expect(column!.className).toMatch(/max-h-\[700px]/)
  })

  it('renders featured news article card edge to edge without featured or secondary badge', () => {
    render(<LaunchpadCarousel />)

    // Verify news card badges are removed
    const newsPanel = screen.getByTestId('moltnation-news-panel')
    expect(within(newsPanel).queryByText(/FEATURED/i)).not.toBeInTheDocument()
    expect(within(newsPanel).getByText('The 2026 Moltmaxxing Protocol')).toBeInTheDocument()
    expect(within(newsPanel).getByText('READ ARTICLE')).toBeInTheDocument()
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

  it('opens reader modal when clicking an article from the scrollable list', () => {
    render(<LaunchpadCarousel />)

    // Find articles list header (WIRE removed)
    expect(screen.getByText(/ARTICLES \(\d+\)/i)).toBeInTheDocument()
    expect(screen.queryByText(/WIRE ARTICLES/i)).not.toBeInTheDocument()

    // Click on an article item (h5 heading)
    const article = screen.getByRole('heading', { level: 5, name: /From Prompt Engineering to Bio-Silicon Cognition/i })
    fireEvent.click(article)

    // Modal reader should open
    expect(screen.getByTitle('Close Modal')).toBeInTheDocument()
  })
})
