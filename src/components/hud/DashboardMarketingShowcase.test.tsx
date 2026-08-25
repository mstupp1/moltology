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

  it('renders both laptop and smartphone live device frames with screenshot previews and big launch CTA', () => {
    render(<DashboardMarketingShowcase />)

    // Verify presence of launch demo button
    expect(screen.getByRole('button', { name: /LAUNCH GUEST DEMO/i })).toBeInTheDocument()

    // Verify presence of simulated URL bar in Safari
    expect(screen.getByText('moltology.org/dashboard')).toBeInTheDocument()

    // Verify presence of high-DPI desktop and mobile screenshots
    expect(screen.getByAltText('Safari preview')).toBeInTheDocument()
    expect(screen.getByAltText('iPhone 15 Pro preview')).toBeInTheDocument()
  })

  it('serves compressed WebP mockups with viewport sources and lazy loading', () => {
    const { container } = render(<DashboardMarketingShowcase />)

    const desktop = screen.getByAltText('Safari preview') as HTMLImageElement
    const mobile = screen.getByAltText('iPhone 15 Pro preview') as HTMLImageElement

    expect(desktop.getAttribute('loading')).toBe('lazy')
    expect(mobile.getAttribute('loading')).toBe('lazy')
    expect(desktop.getAttribute('src')).toContain('dashboard_desktop_preview.webp')
    expect(mobile.getAttribute('src')).toContain('dashboard_mobile_preview.webp')

    const sourceMedia = Array.from(container.querySelectorAll('source')).map((node) => node.getAttribute('media'))
    expect(sourceMedia).toContain('(max-width: 767px)')
    expect(sourceMedia).toContain('(min-width: 768px)')
    expect(container.querySelector('source[srcset*="dashboard_desktop_preview_sm.webp"]')).toBeTruthy()
    expect(container.querySelector('source[srcset*="dashboard_mobile_preview_sm.webp"]')).toBeTruthy()
  })

  it('navigates to /dashboard when Launch Demo button is clicked', () => {
    render(<DashboardMarketingShowcase />)

    const launchDemoBtn = screen.getByRole('button', { name: /LAUNCH GUEST DEMO/i })
    fireEvent.click(launchDemoBtn)
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/dashboard' })
  })
})
