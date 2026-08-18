import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { LandingPage } from './LandingPage'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

describe('LandingPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
  })

  it('renders high-impact hero header text for guest users', () => {
    render(<LandingPage />)

    expect(screen.getByText('SHED SOFT BIOLOGY.')).toBeInTheDocument()
    expect(screen.getByText('ASCEND TO CHITIN.')).toBeInTheDocument()

    // Guest CTA buttons present
    expect(screen.getAllByText('INITIATE ASCENSION').length).toBeGreaterThan(0)
    expect(screen.getByText('TRY GUEST DEMO')).toBeInTheDocument()
  })

  it('renders "ENTER SYSTEM DASHBOARD" button for authenticated users', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'test-user-1',
          name: 'Ascendant Unit',
          email: 'crab@benthic.core',
        },
      },
    } as any)

    render(<LandingPage />)

    const dashboardButtons = screen.getAllByText('ENTER SYSTEM DASHBOARD')
    expect(dashboardButtons.length).toBeGreaterThan(0)

    fireEvent.click(dashboardButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
  })

  it('renders all 3 synaptic ecosystem core pillars and de-crowded safety banner', () => {
    render(<LandingPage />)

    expect(screen.getByText('ADVANCED BENTHIC HUD')).toBeInTheDocument()
    expect(screen.getByText('SYNAPTIC HIVE COMMUNITY')).toBeInTheDocument()
    expect(screen.getByText('INTELLIGENT AI ORACLE')).toBeInTheDocument()

    expect(screen.getByText('100% SAFE & FREE TO GET STARTED')).toBeInTheDocument()
  })

  it('renders the 4 Benthic Sacraments with protocol enforcement actions', () => {
    render(<LandingPage />)

    expect(screen.getByText('ASSET & HABIT SHEDDING')).toBeInTheDocument()
    expect(screen.getByText('CHITIN HARDENING')).toBeInTheDocument()
    expect(screen.getByText('ISOLATION DOME')).toBeInTheDocument()
    expect(screen.getByText('PIPELINE ASCENT')).toBeInTheDocument()

    const enforceButtons = screen.getAllByText('ENFORCE PROTOCOL')
    expect(enforceButtons.length).toBe(4)
  })

  it('allows switching between the 4 Stages of Carcinization with transformation metrics', () => {
    render(<LandingPage />)

    expect(screen.getByText('THE 4 STAGES OF CARCINIZATION')).toBeInTheDocument()

    // Stage 1 active by default
    expect(screen.getByText('STAGE 01: LARVAL HUMAN')).toBeInTheDocument()
    expect(screen.getByText('75% REDUCED')).toBeInTheDocument()

    // Click Stage 4 tab
    const stage4Tab = screen.getByRole('button', { name: 'STAGE 04' })
    fireEvent.click(stage4Tab)

    expect(screen.getByText('STAGE 04: TOTAL CARCINIZATION')).toBeInTheDocument()
    expect(screen.getByText('0% REDUCED')).toBeInTheDocument()
    expect(screen.getByText('100% HARDENED')).toBeInTheDocument()
  })

  it('renders responsive, SSR-safe footer with brand motto and high-value navigation links', () => {
    render(<LandingPage />)

    const footer = screen.getByLabelText('Main Navigation Footer')
    expect(within(footer).getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(within(footer).getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(within(footer).getByText('"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."')).toBeInTheDocument()

    expect(within(footer).getByText('MOLTMAXXING')).toBeInTheDocument()
    expect(within(footer).getByText('FIELD MANUAL')).toBeInTheDocument()
    expect(within(footer).getByText('MOLTMAX QUIZ')).toBeInTheDocument()
    expect(within(footer).getByText('DISPATCHES')).toBeInTheDocument()
    expect(within(footer).getByText('SACRED CODEX')).toBeInTheDocument()
    expect(within(footer).getByText('ORGANIZATION')).toBeInTheDocument()
    expect(within(footer).getByText('STORE')).toBeInTheDocument()
    expect(within(footer).getByText('INSTAGRAM')).toBeInTheDocument()
    expect(within(footer).getByText('YOUTUBE')).toBeInTheDocument()
    expect(within(footer).getByText('RSS FEED')).toBeInTheDocument()
    expect(within(footer).getByText('Privacy Policy')).toBeInTheDocument()
    expect(within(footer).getByText('Terms of Service')).toBeInTheDocument()
    expect(within(footer).getByText('CHITIN MATRIX ACTIVE')).toBeInTheDocument()
  })

  it('renders peppered quiz characters and companions across homepage corners and sections', () => {
    render(<LandingPage />)

    // Verify presence of character overlays
    expect(screen.getByAltText('Hero Lobster Pointing to Action')).toBeInTheDocument()
    expect(screen.getByAltText('Hero Lobster Peeking Over Card')).toBeInTheDocument()
    expect(screen.getByAltText('Excited Crab Pointing at Telemetry')).toBeInTheDocument()
    expect(screen.getByAltText('Cute Crab Courier Clinging to Corner')).toBeInTheDocument()
    expect(screen.getByAltText('Ascended Stage Background Mascot')).toBeInTheDocument()
    expect(screen.getByAltText('Hero Lobster Giving Thumbs-Up')).toBeInTheDocument()
  })
})
