import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { HUDHeader } from './HUDHeader'
import { authClient } from '@/lib/auth-client'

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/dashboard' }),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: vi.fn(() => ({ data: null })),
    signOut: vi.fn(),
  },
}))

describe('HUDHeader Component', () => {
  it('renders default larva unit fallback image when user is not signed in', () => {
    vi.mocked(authClient.useSession).mockReturnValue({ data: null } as any)

    render(<HUDHeader />)

    const img = screen.getByRole('img', { name: 'Larva Unit 3D' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/extracted/larva_unit_3d.jpg')
    expect(screen.getByText('SIGN IN TO PERSIST')).toBeInTheDocument()
  })

  it('renders Google SSO avatar image and opens dropdown menu on click with username and signout option', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'sso-123',
          name: 'Carcinus Ascendant',
          email: 'carcinus@moltology.org',
          image: 'https://lh3.googleusercontent.com/avatar.jpg',
        },
      },
    } as any)

    render(<HUDHeader />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    expect(avatarBtn).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()

    // Click avatar button to toggle dropdown menu
    fireEvent.click(avatarBtn)

    expect(screen.getAllByText('Carcinus Ascendant').length).toBeGreaterThan(0)
    expect(screen.getByText('carcinus@moltology.org')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })

  it('renders letter avatar fallback when signed in user has no image and opens dropdown', () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      data: {
        user: {
          id: 'sso-456',
          name: 'Larva Member',
          email: 'larva@moltology.org',
          image: null,
        },
      },
    } as any)

    render(<HUDHeader />)

    const avatarBtn = screen.getByRole('button', { name: /user account menu/i })
    fireEvent.click(avatarBtn)

    expect(screen.getAllByText('Larva Member').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
  })
})
