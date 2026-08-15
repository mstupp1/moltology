import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LandingPage } from './LandingPage'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
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

    expect(screen.getByText('ADVANCED PLATFORM')).toBeInTheDocument()
    expect(screen.getByText('SYNAPTIC HIVE MESH')).toBeInTheDocument()
    expect(screen.getByText('INTELLIGENT AI CORE')).toBeInTheDocument()

    expect(screen.getByText('100% SAFE & FREE TO GET STARTED')).toBeInTheDocument()
  })

  it('renders the 4 Benthic Sacraments with protocol enforcement actions', () => {
    render(<LandingPage />)

    expect(screen.getByText('ASSET SHEDDING')).toBeInTheDocument()
    expect(screen.getByText('CHITIN PATTERNING')).toBeInTheDocument()
    expect(screen.getByText('FAULT ISOLATION')).toBeInTheDocument()
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

  it('renders responsive, SSR-safe footer with brand motto and mobile navigation links', () => {
    render(<LandingPage />)

    expect(screen.getByText('THE ORDER OF THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('"Flesh Dies. The Shell Endures. Submit. Shed. Ascend."')).toBeInTheDocument()

    expect(screen.getByText('MOLTOLOGY ORG')).toBeInTheDocument()
    expect(screen.getByText('CARCINIZATION PIPELINE')).toBeInTheDocument()
    expect(screen.getByText('INSTAGRAM')).toBeInTheDocument()
    expect(screen.getByText('YOUTUBE')).toBeInTheDocument()
    expect(screen.getByText('SACRED LECTURES')).toBeInTheDocument()
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
    expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    expect(screen.getByText('CHITIN MATRIX ENFORCED')).toBeInTheDocument()
  })
})
