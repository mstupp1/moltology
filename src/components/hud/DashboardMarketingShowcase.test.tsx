import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DashboardMarketingShowcase } from './DashboardMarketingShowcase'
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

describe('DashboardMarketingShowcase Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)
  })

  it('renders both laptop and smartphone live device frames with centered controls and big launch CTA', () => {
    render(<DashboardMarketingShowcase />)

    // Verify centered controls and launch demo button
    expect(screen.getByRole('button', { name: /Desktop/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mobile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /LAUNCH GUEST DEMO/i })).toBeInTheDocument()

    // Verify presence of simulated URL bar in Safari
    expect(screen.getByText('hub.moltology.org/dashboard')).toBeInTheDocument()
    expect(screen.getByText('GUEST READY')).toBeInTheDocument()

    // Verify live HUD header rendered inside laptop
    expect(screen.getAllByText('MOLTOLOGY').length).toBeGreaterThan(0)
    expect(screen.getByText('WELCOME,')).toBeInTheDocument()
    expect(screen.getByText('INITIATE')).toBeInTheDocument()

    // Verify live Launchpad carousel rendered inside laptop
    expect(screen.getByText('PORTAL DIRECTIVES')).toBeInTheDocument()

    // Verify smartphone mobile frame elements
    expect(screen.getAllByText('MOLTOLOGY').length).toBeGreaterThan(0)
    expect(screen.getByText('ACTIVE MOLT')).toBeInTheDocument()
    expect(screen.getByText('100% SYNCED')).toBeInTheDocument()
    expect(screen.getByText('TEST GUEST SANDBOX')).toBeInTheDocument()
  })

  it('allows switching device views between dual view, desktop, and mobile', () => {
    render(<DashboardMarketingShowcase />)

    // Switch to desktop-only view
    const desktopBtn = screen.getByRole('button', { name: /DESKTOP/i })
    fireEvent.click(desktopBtn)

    // Switch to mobile-only view
    const mobileBtn = screen.getByRole('button', { name: /MOBILE/i })
    fireEvent.click(mobileBtn)

    // Switch back to dual view
    const dualBtn = screen.getByRole('button', { name: /DUAL VIEW/i })
    fireEvent.click(dualBtn)
  })

  it('navigates to /dashboard when Launch Demo or mobile test button is clicked', () => {
    render(<DashboardMarketingShowcase />)

    const launchDemoButtons = screen.getAllByRole('button', { name: /LAUNCH GUEST DEMO|TEST GUEST SANDBOX/i })
    expect(launchDemoButtons.length).toBeGreaterThan(0)

    fireEvent.click(launchDemoButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
  })
})
