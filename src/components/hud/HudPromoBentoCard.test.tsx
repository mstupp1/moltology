import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HudPromoBentoCard, PROMO_SLIDES } from './HudPromoBentoCard'

// Mock TanStack Router
const mockNavigate = vi.fn()
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

describe('HudPromoBentoCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the initial Early Access promo slide by default', () => {
    render(<HudPromoBentoCard />)

    expect(screen.getByText('WELCOME TO THE BENTHIC GRID')).toBeInTheDocument()
    expect(screen.getByText('BEGIN ONBOARDING')).toBeInTheDocument()
    expect(screen.getAllByText(/EARLY ACCESS/i).length).toBeGreaterThan(0)
  })

  it('cycles forward and backward through all 4 slides using navigation buttons', () => {
    render(<HudPromoBentoCard />)

    const nextButtons = screen.getAllByLabelText('Next promotional slide')
    const nextBtn = nextButtons[0]

    // Slide 1 -> 2: Welcome Bundle
    fireEvent.click(nextBtn)
    expect(screen.getByText('NEW MEMBER FOUNDATION CACHE')).toBeInTheDocument()
    expect(screen.getByText('CLAIM BUNDLE (50% OFF)')).toBeInTheDocument()

    // Slide 2 -> 3: Fall Promo
    fireEvent.click(nextBtn)
    expect(screen.getByText('THE AUTUMN MOLT FESTIVAL')).toBeInTheDocument()
    expect(screen.getByText('EXPLORE FALL FESTIVAL')).toBeInTheDocument()

    // Slide 3 -> 4: Cyber-Chassis Expo (Wildcard)
    fireEvent.click(nextBtn)
    expect(screen.getByText('MK-IV CYBER-CHASSIS EXPO')).toBeInTheDocument()
    expect(screen.getByText('CONFIGURE CHASSIS')).toBeInTheDocument()

    // Slide 4 -> 1: Loop back to Early Access
    fireEvent.click(nextBtn)
    expect(screen.getByText('WELCOME TO THE BENTHIC GRID')).toBeInTheDocument()

    // Slide 1 -> 4: Prev button loops backward
    const prevButtons = screen.getAllByLabelText('Previous promotional slide')
    const prevBtn = prevButtons[0]
    fireEvent.click(prevBtn)
    expect(screen.getByText('MK-IV CYBER-CHASSIS EXPO')).toBeInTheDocument()
  })

  it('allows direct slide selection via the bottom tab rail', () => {
    render(<HudPromoBentoCard />)

    // Click Fall Festival tab
    const fallTab = screen.getByLabelText(/Select bulletin 03: THE AUTUMN MOLT FESTIVAL/i)
    fireEvent.click(fallTab)

    expect(screen.getByText('THE AUTUMN MOLT FESTIVAL')).toBeInTheDocument()
    expect(screen.getByText('EXPLORE FALL FESTIVAL')).toBeInTheDocument()

    // Click Welcome Bundle tab
    const bundleTab = screen.getByLabelText(/Select bulletin 02: NEW MEMBER FOUNDATION CACHE/i)
    fireEvent.click(bundleTab)

    expect(screen.getByText('NEW MEMBER FOUNDATION CACHE')).toBeInTheDocument()
    expect(screen.getByText('CLAIM BUNDLE (50% OFF)')).toBeInTheDocument()
  })

  it('navigates to appropriate destination routes when primary CTA is clicked', () => {
    render(<HudPromoBentoCard />)

    // Slide 1: Early Access CTA
    const cta1 = screen.getByText('BEGIN ONBOARDING')
    fireEvent.click(cta1)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/pipeline' })

    // Switch to Slide 2 and click CTA
    const bundleTab = screen.getByLabelText(/Select bulletin 02/i)
    fireEvent.click(bundleTab)
    const cta2 = screen.getByText('CLAIM BUNDLE (50% OFF)')
    fireEvent.click(cta2)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/market' })

    // Switch to Slide 4 (Wildcard) and click CTA
    const chassisTab = screen.getByLabelText(/Select bulletin 04/i)
    fireEvent.click(chassisTab)
    const cta4 = screen.getByText('CONFIGURE CHASSIS')
    fireEvent.click(cta4)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/chassis' })
  })

  it('auto-advances slides on timer tick when playing', () => {
    render(<HudPromoBentoCard autoPlayIntervalMs={5000} />)

    expect(screen.getByText('WELCOME TO THE BENTHIC GRID')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('NEW MEMBER FOUNDATION CACHE')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText('THE AUTUMN MOLT FESTIVAL')).toBeInTheDocument()
  })

  it('pauses timer on hover and resumes on mouse leave', () => {
    render(<HudPromoBentoCard autoPlayIntervalMs={5000} />)

    const card = screen.getByTestId('hud-promo-bento-card')

    // Hover pauses
    fireEvent.mouseEnter(card)

    act(() => {
      vi.advanceTimersByTime(6000)
    })
    // Still on slide 1
    expect(screen.getByText('WELCOME TO THE BENTHIC GRID')).toBeInTheDocument()

    // Mouse leave unpauses
    fireEvent.mouseLeave(card)

    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('NEW MEMBER FOUNDATION CACHE')).toBeInTheDocument()
  })

  it('applies border-l-4 and dynamically updates left border color to match active slide accent', () => {
    render(<HudPromoBentoCard />)

    const card = screen.getByTestId('hud-promo-bento-card')
    expect(card.className).toContain('border-l-4')
    expect(card.style.borderLeftWidth).toBe('4px')
    expect(card.style.borderLeftColor).toBe('rgb(0, 255, 255)')

    // Switch to Slide 2 (Welcome Bundle: #c084fc -> rgb(192, 132, 252))
    const bundleTab = screen.getByLabelText(/Select bulletin 02/i)
    fireEvent.click(bundleTab)
    expect(card.style.borderLeftColor).toBe('rgb(192, 132, 252)')

    // Switch to Slide 3 (Fall Festival: #fb923c -> rgb(251, 146, 60))
    const fallTab = screen.getByLabelText(/Select bulletin 03/i)
    fireEvent.click(fallTab)
    expect(card.style.borderLeftColor).toBe('rgb(251, 146, 60)')
  })

  it('dynamically updates overlaid CTA button and chevron background colors to match active slide primary color', () => {
    render(<HudPromoBentoCard />)

    const nextBtn = screen.getByLabelText('Next promotional slide')
    const cta1 = screen.getByText('BEGIN ONBOARDING').closest('button')
    expect(cta1?.className).toContain('bg-[#00ffff]/20')
    expect(nextBtn.className).toContain('hover:bg-[#00ffff]')

    // Switch to Slide 2 (Welcome Bundle - purple #c084fc)
    const bundleTab = screen.getByLabelText(/Select bulletin 02/i)
    fireEvent.click(bundleTab)
    const cta2 = screen.getByText('CLAIM BUNDLE (50% OFF)').closest('button')
    expect(cta2?.className).toContain('bg-[#c084fc]/20')
    expect(nextBtn.className).toContain('hover:bg-[#c084fc]')

    // Switch to Slide 3 (Fall Festival - orange #fb923c)
    const fallTab = screen.getByLabelText(/Select bulletin 03/i)
    fireEvent.click(fallTab)
    const cta3 = screen.getByText('EXPLORE FALL FESTIVAL').closest('button')
    expect(cta3?.className).toContain('bg-[#fb923c]/20')
    expect(nextBtn.className).toContain('hover:bg-[#fb923c]')

    // Switch to Slide 4 (Cyber Chassis - sky blue #38bdf8)
    const chassisTab = screen.getByLabelText(/Select bulletin 04/i)
    fireEvent.click(chassisTab)
    const cta4 = screen.getByText('CONFIGURE CHASSIS').closest('button')
    expect(cta4?.className).toContain('bg-[#38bdf8]/20')
    expect(nextBtn.className).toContain('hover:bg-[#38bdf8]')
  })
})


