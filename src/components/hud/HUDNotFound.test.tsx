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
    useSession: vi.fn(() => ({ data: null, isPending: false })),
    signOut: vi.fn(),
  },
}))

describe('HUDNotFound (404 Component)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPathname = '/non-existent-sector'
  })

  it('renders the 404 header and status information', () => {
    render(<HUDNotFound />)

    expect(screen.getByText('PAGE NOT FOUND · ERROR 404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Page Not Found' })).toBeInTheDocument()
    expect(screen.getByText('STATUS: 404 NOT FOUND')).toBeInTheDocument()
    expect(screen.getByText('HTTP 404')).toBeInTheDocument()
    expect(screen.getByText('/non-existent-sector')).toBeInTheDocument()
    expect(document.querySelector('title')?.textContent).toBe('Page Not Found | Moltology')
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })

  it('provides navigation links back to Home, Dashboard, and MoltNation News', () => {
    render(<HUDNotFound />)

    const surfaceLink = screen.getByTestId('link-to-/')
    expect(surfaceLink).toBeInTheDocument()
    expect(screen.getByText('Return Home')).toBeInTheDocument()

    const dashboardLink = screen.getByTestId('link-to-/dashboard')
    expect(dashboardLink).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()

    const newsLink = screen.getByTestId('link-to-/news')
    expect(newsLink).toBeInTheDocument()
    expect(screen.getByText('MoltNation News')).toBeInTheDocument()
  })

  it('calls history.back or navigate when Go Back button is clicked', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {})

    // Simulate history length > 1
    Object.defineProperty(window.history, 'length', { value: 3, configurable: true })

    render(<HUDNotFound />)

    const backButton = screen.getByRole('button', { name: /Go Back/i })
    fireEvent.click(backButton)

    expect(backSpy).toHaveBeenCalled()
    backSpy.mockRestore()
  })
})
