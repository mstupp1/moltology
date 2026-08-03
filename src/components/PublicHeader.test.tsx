import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PublicHeader } from './PublicHeader'
import { authClient } from '@/lib/auth-client'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
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

    expect(screen.getByText('THE SYNAPTIC PATH')).toBeInTheDocument()
    expect(screen.getByText('MOLTOLOGY.ORG FOUNDATION')).toBeInTheDocument()
    expect(screen.getByText('PORTAL HOME')).toBeInTheDocument()
    expect(screen.getByText('ORGANIZATION')).toBeInTheDocument()
    
    const storeLink = screen.getByRole('link', { name: /STORE/i })
    expect(storeLink).toBeInTheDocument()
    expect(storeLink).toHaveAttribute('href', 'https://www.etsy.com/shop/SaasTrash')
  })

  it('highlights the active page route with modern glowing pill capsule styling', () => {
    const { rerender } = render(<PublicHeader activePage="home" />)
    const homeBtn = screen.getByRole('button', { name: /PORTAL HOME/i })
    expect(homeBtn.className).toContain('bg-gradient-to-r')

    rerender(<PublicHeader activePage="org" />)
    const orgBtn = screen.getByRole('button', { name: /ORGANIZATION/i })
    expect(orgBtn.className).toContain('bg-gradient-to-r')
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
})
