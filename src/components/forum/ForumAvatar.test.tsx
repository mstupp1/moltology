import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { beforeEach, describe, it, expect, vi } from 'vitest'

const requestStill3D = vi.hoisted(() => vi.fn(() => new Promise<string | null>(() => {})))
vi.mock('@/lib/avatar3d-portrait-queue', () => ({ requestStill3D, readyStill3D: () => null }))

import { set3DSupportForTests } from '@/lib/avatar3d-support'
import { ForumAvatar } from './ForumAvatar'

beforeEach(() => {
  set3DSupportForTests(true)
  requestStill3D.mockClear()
})

/** The character the 3D still was asked for. */
const askedFor = () => (requestStill3D.mock.calls.at(-1) as unknown as [Record<string, unknown>] | undefined)?.[0]

describe('ForumAvatar', () => {
  it('renders custom image when valid http URL is provided', () => {
    render(
      <ForumAvatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        authorName="Larva Unit #8971"
      />,
    )

    const customImg = screen.getByTestId('forum-avatar-custom-image')
    expect(customImg).toBeInTheDocument()
    expect(customImg).toHaveAttribute(
      'src',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    )
    expect(customImg).toHaveAttribute('alt', 'Larva Unit #8971')
  })

  it('falls back to the 3D character still when src is empty or null', () => {
    render(<ForumAvatar src="" authorName="CLAW_LORD_99" authorHandle="claw_lord_99" />)

    expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
    expect(screen.getByTestId('character-still-loading')).toBeInTheDocument()
    expect(askedFor()).toMatchObject({ seed: 'claw_lord_99' })
    expect(screen.queryByTestId('lobster-avatar-full-body')).toBeNull()
  })

  it('falls back to the 3D character still when src is /images/stage1_larva.png', () => {
    render(<ForumAvatar src="/images/stage1_larva.png" authorName="ABYSSAL_ARCHITECT" />)

    expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
    expect(screen.getByTestId('character-still-loading')).toBeInTheDocument()
    expect(requestStill3D).toHaveBeenCalled()
  })

  it('falls back to the 3D character still when custom image errors', () => {
    render(
      <ForumAvatar src="https://broken-avatar-url.example.com/photo.jpg" authorName="Vaelen" />,
    )

    const customImg = screen.getByTestId('forum-avatar-custom-image')
    expect(customImg).toBeInTheDocument()

    // Trigger image loading failure
    fireEvent.error(customImg)

    expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
    expect(screen.getByTestId('character-still-loading')).toBeInTheDocument()
    expect(requestStill3D).toHaveBeenCalled()
  })

  it('uses custom avatarConfig if provided', () => {
    render(
      <ForumAvatar
        src={null}
        authorName="Kaelith"
        avatarConfig={{
          style: 'critters',
          seed: 'kaelith-custom-seed',
          backgroundTheme: 'abyssal_indigo',
        }}
      />,
    )

    expect(askedFor()).toMatchObject({ seed: 'kaelith-custom-seed' })
  })

  it('applies custom className to the container', () => {
    render(<ForumAvatar src="" authorName="Unit" className="w-5 h-5 shadow-sm" />)

    const container = screen.getByTestId('forum-avatar-container')
    expect(container).toHaveClass('w-5')
    expect(container).toHaveClass('h-5')
    expect(container).toHaveClass('shadow-sm')
  })

  it('defaults to md size when size is unspecified', () => {
    render(<ForumAvatar src="" authorName="DefaultUnit" />)
    const container = screen.getByTestId('forum-avatar-container')
    expect(container).toHaveClass('w-9')
    expect(container).toHaveClass('h-9')
  })

  it('supports explicit size presets such as lg', () => {
    render(<ForumAvatar src="" authorName="LgUnit" size="lg" />)
    const container = screen.getByTestId('forum-avatar-container')
    expect(container).toHaveClass('w-11')
    expect(container).toHaveClass('h-11')
  })
})

it('preserves species and equipped items when a character overrides an account photo', () => {
  render(
    <ForumAvatar
      src="https://example.com/photo.jpg"
      avatarConfig={{
        style: 'critters',
        seed: 'member',
        race: 'crab',
        build: 'chunky',
        shellColor: 'jade',
        equipment: { head: { visualKey: 'creator-crown', rarity: 'common' } },
      }}
    />,
  )
  expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
  expect(askedFor()).toMatchObject({ race: 'crab', build: 'chunky', equipment: { head: { visualKey: 'creator-crown' } } })
})
