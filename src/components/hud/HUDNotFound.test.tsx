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

  it('says plainly that the page is missing and shows the requested path', () => {
    render(<HUDNotFound />)

    expect(screen.getByText('Error 404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByText(/couldn.t find that page/)).toBeInTheDocument()
    expect(screen.getByText('/non-existent-sector')).toBeInTheDocument()
    expect(document.querySelector('title')?.textContent).toBe('Page Not Found | Moltology')
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex, nofollow')
  })

  it('provides links home and to the dashboard', () => {
    render(<HUDNotFound />)

    expect(screen.getByTestId('link-to-/')).toBeInTheDocument()
    expect(screen.getByText('Go home')).toBeInTheDocument()
    expect(screen.getByTestId('link-to-/dashboard')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
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
