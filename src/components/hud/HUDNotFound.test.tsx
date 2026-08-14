import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HUDNotFound } from './HUDNotFound'
import { authClient } from '@/lib/auth-client'

const mockNavigate = vi.fn()
let mockPathname = '/non-existent-sector'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
  Link: ({ children, to, className }: any) => (
    <a href={to} className={className} data-testid={`link-to-${to}`}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

describe('HUDNotFound (404 Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/non-existent-sector'
  })

  it('renders the diegetic 404 header and telemetry information', () => {
    render(<HUDNotFound />)

    expect(screen.getByText(/SIGNAL ERROR \/\/ CODE: 404/i)).toBeInTheDocument()
    expect(screen.getByText(/Sector Void \/\/ Trench Uncharted/i)).toBeInTheDocument()
    expect(screen.getByText(/BENTHIC TRANSMISSION: UNRESOLVED/i)).toBeInTheDocument()
    expect(screen.getByText(/10,928m \/ 108.6 MPa/i)).toBeInTheDocument()
    expect(screen.getByText('/non-existent-sector')).toBeInTheDocument()
  })

  it('provides navigation links back to Surface, Central HUD, and MoltNation News', () => {
    render(<HUDNotFound />)

    const surfaceLink = screen.getByTestId('link-to-/')
    expect(surfaceLink).toBeInTheDocument()
    expect(screen.getByText('Return to Surface')).toBeInTheDocument()

    const dashboardLink = screen.getByTestId('link-to-/dashboard')
    expect(dashboardLink).toBeInTheDocument()
    expect(screen.getByText('Central HUD')).toBeInTheDocument()

    const newsLink = screen.getByTestId('link-to-/news')
    expect(newsLink).toBeInTheDocument()
    expect(screen.getByText('MoltNation News')).toBeInTheDocument()
  })

  it('calls history.back or navigate when Previous Sector button is clicked', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})

    // Simulate history length > 1
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true })

    render(<HUDNotFound />)

    const backButton = screen.getByRole('button', { name: /Previous Sector/i })
    fireEvent.click(backButton)

    expect(backSpy).toHaveBeenCalled()
    backSpy.mockRestore()
  })
})
