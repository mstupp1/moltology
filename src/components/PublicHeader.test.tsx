import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PublicHeader } from './PublicHeader'
import { authClient } from '@/lib/auth-client'

let mockPathname = '/'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: mockPathname }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

describe('PublicHeader Navigation Component', () => {
  it('renders shared brand emblem, title, and route links including Etsy STORE', () => {
    render(<PublicHeader activePage="home" />)

    expect(screen.getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /THE SYNAPTIC PATH/i })).toBeInTheDocument()
    expect(screen.getByText('ORGANIZATION')).toBeInTheDocument()
    
    const storeLink = screen.getByRole('link', { name: /STORE/i })
    expect(storeLink).toBeInTheDocument()
    expect(storeLink).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
  })

  it('highlights the active page route with flat pill capsule styling', () => {
    mockPathname = '/'
    const { rerender } = render(<PublicHeader activePage="home" />)
    const homeBtn = screen.getByRole('button', { name: /THE SYNAPTIC PATH/i })
    expect(homeBtn.className).toContain('text-cyan-300')

    mockPathname = '/org'
    rerender(<PublicHeader activePage="org" />)
    const orgBtn = screen.getByRole('button', { name: /ORGANIZATION/i })
    expect(orgBtn.className).toContain('text-cyan-300')
  })

  it('automatically highlights NEWS tab for any /news sub-page article route', () => {
    mockPathname = '/news/from-prompt-engineering-to-bio-silicon-cognition'
    render(<PublicHeader />)
    const blogBtn = screen.getByRole('button', { name: /NEWS/i })
    expect(blogBtn.className).toContain('text-cyan-300')
  })

  it('triggers authentication modal callback when clicking LOG IN / JOIN PATH', () => {
    const onOpenAuth = vi.fn()
    render(<PublicHeader activePage="home" onOpenAuth={onOpenAuth} />)

    const loginBtn = screen.getByRole('button', { name: /LOG IN/i })
    fireEvent.click(loginBtn)
    expect(onOpenAuth).toHaveBeenCalledWith('login')
  })

  it('renders user SSO avatar menu when user is signed in', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'user-1',
          name: 'Google User',
          email: 'googleuser@gmail.com',
          image: 'https://lh3.googleusercontent.com/sso-avatar.jpg',
        },
      },
    } as any)

    render(<PublicHeader activePage="home" />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    expect(avatarBtn).toBeInTheDocument()

    // Click avatar button to reveal dropdown
    fireEvent.click(avatarBtn)

    expect(screen.getByText('Google User')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('hides header when scrolling down past threshold and shows header when scrolling up', () => {
    const { container } = render(<PublicHeader activePage="home" />)
    const headerEl = container.querySelector('header')!

    expect(headerEl.className).toContain('translate-y-0')

    // Simulate scroll down
    Object.defineProperty(window, 'scrollY', { value: 150, writable: true })
    fireEvent.scroll(window)

    expect(headerEl.className).toContain('-translate-y-full')

    // Simulate scroll up
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true })
    fireEvent.scroll(window)

    expect(headerEl.className).toContain('translate-y-0')
  })
})
