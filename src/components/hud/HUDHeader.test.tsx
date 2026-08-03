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
    expect(screen.getByText('CONVERSION IN PROGRESS')).toBeInTheDocument()
  })

  it('renders Google SSO avatar image when user is signed in', () => {
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

    const avatarImg = screen.getByRole('img', { name: 'Carcinus Ascendant' })
    expect(avatarImg).toBeInTheDocument()
    expect(screen.getByText('Carcinus Ascendant')).toBeInTheDocument()
  })

  it('renders letter avatar fallback when signed in user has no image', () => {
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

    expect(screen.getByText('Larva Member')).toBeInTheDocument()
    expect(screen.getByText('L')).toBeInTheDocument()
  })
})
