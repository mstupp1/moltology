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
      />,
    )

    const img = screen.getByRole('img', { name: 'Larva Unit 3D' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/extracted/larva_unit_3d.jpg')
  })

  it('renders xxs size preset with w-4 h-4 text-[8px]', () => {
    const user = {
      name: 'Benthic Initiate',
      email: 'initiate@moltology.org',
    }

    const { container } = render(<UserAvatar user={user} size="xxs" />)
    const avatar = container.firstChild as HTMLElement
    expect(avatar.className).toContain('w-4 h-4 text-[8px]')
    expect(screen.getByText('B')).toBeInTheDocument()
  })
})

it('prefers a saved equipped character over an account photo', () => {
  const { container } = render(
    <UserAvatar
      user={{
        name: 'Crab',
        image: 'https://example.com/photo.jpg',
        avatarConfig: {
          style: 'critters',
          seed: 'member',
          race: 'crab',
          equipment: { head: { visualKey: 'creator-bow', rarity: 'common' } },
        },
      }}
    />,
  )
  expect(container.querySelector('img[src="https://example.com/photo.jpg"]')).toBeNull()
  expect(container.querySelector('[data-renderer="3d"]')).not.toBeNull()
})

it('puts the portrait glass over a character, but not at the tiny sizes', () => {
  const user = { name: 'Crab', avatarConfig: { style: 'critters' as const, seed: 'member', race: 'crab' as const } }
  const { rerender } = render(<UserAvatar user={user} size="md" />)
  expect(screen.getByTestId('glass-lens')).toBeInTheDocument()
  rerender(<UserAvatar user={user} size="xxs" />)
  expect(screen.queryByTestId('glass-lens')).toBeNull()
  rerender(<UserAvatar user={{ name: 'Photo', image: 'https://example.com/p.jpg' }} size="md" />)
  expect(screen.queryByTestId('glass-lens')).toBeNull()
})

it('holds a pulse placeholder instead of a letter or photo while the character loads', () => {
  const user = { name: 'Carcinus', image: 'https://example.com/p.jpg' }
  const { rerender } = render(<UserAvatar user={user} pending size="row" />)
  expect(screen.getByTestId('user-avatar-pending')).toBeInTheDocument()
  expect(screen.queryByText('C')).toBeNull()
  expect(screen.queryByRole('img')).toBeNull()
  rerender(<UserAvatar user={user} size="row" />)
  expect(screen.queryByTestId('user-avatar-pending')).toBeNull()
})
