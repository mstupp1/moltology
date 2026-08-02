import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PublicHeader } from './PublicHeader'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({ data: null }),
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
})
