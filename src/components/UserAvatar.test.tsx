import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UserAvatar } from './UserAvatar'

describe('UserAvatar Component', () => {
  it('renders Google SSO avatar image when user image URL is provided', () => {
    const user = {
      name: 'Carcinus',
      email: 'carcinus@moltology.org',
      image: 'https://lh3.googleusercontent.com/a/avatar-photo-url',
    }

    render(<UserAvatar user={user} />)

    const img = screen.getByRole('img', { name: 'Carcinus' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://lh3.googleusercontent.com/a/avatar-photo-url')
  })

  it('renders letter avatar fallback with initial letter when no image URL is provided', () => {
    const user = {
      name: 'Ascendant Vaelen',
      email: 'vaelen@moltology.org',
      image: null,
    }

    render(<UserAvatar user={user} />)

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('uses first character of email if name is not available for letter fallback', () => {
    const user = {
      name: null,
      email: 'zealot@moltology.org',
    }

    render(<UserAvatar user={user} />)

    expect(screen.getByText('Z')).toBeInTheDocument()
  })

  it('falls back to letter avatar if image onError fires', () => {
    const user = {
      name: 'Soft Shedder',
      email: 'softshed@moltology.org',
      image: 'https://invalid-domain.com/broken.jpg',
    }

    render(<UserAvatar user={user} />)

    const img = screen.getByRole('img')
    fireEvent.error(img)

    expect(screen.getByText('S')).toBeInTheDocument()
  })

  it('renders fallback image when specified and user is not logged in', () => {
    render(
      <UserAvatar
        user={null}
        fallbackSrc="/images/extracted/larva_unit_3d.jpg"
        alt="Larva Unit 3D"
      />
    )

    const img = screen.getByRole('img', { name: 'Larva Unit 3D' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/extracted/larva_unit_3d.jpg')
  })
})
