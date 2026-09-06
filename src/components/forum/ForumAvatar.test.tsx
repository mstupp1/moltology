import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ForumAvatar } from './ForumAvatar'

describe('ForumAvatar', () => {
  it('renders custom image when valid http URL is provided', () => {
    render(
      <ForumAvatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
        authorName="Larva Unit #8971"
      />
    )

    const customImg = screen.getByTestId('forum-avatar-custom-image')
    expect(customImg).toBeInTheDocument()
    expect(customImg).toHaveAttribute(
      'src',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    )
    expect(customImg).toHaveAttribute('alt', 'Larva Unit #8971')
  })

  it('falls back to lobster SVG still when src is empty or null', () => {
    render(
      <ForumAvatar
        src=""
        authorName="CLAW_LORD_99"
        authorHandle="claw_lord_99"
      />
    )

    expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
    const lobsterImg = screen.getByTestId('forum-avatar-lobster-still')
    expect(lobsterImg).toBeInTheDocument()
    expect(lobsterImg.getAttribute('src')?.startsWith('data:image/svg+xml')).toBe(true)
    expect(lobsterImg.className).toContain('scale-[1.45]')
    expect(lobsterImg.className).toContain('origin-[center_36%]')
  })

  it('falls back to lobster SVG still when src is /images/stage1_larva.png', () => {
    render(
      <ForumAvatar
        src="/images/stage1_larva.png"
        authorName="ABYSSAL_ARCHITECT"
      />
    )

    expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
    const lobsterImg = screen.getByTestId('forum-avatar-lobster-still')
    expect(lobsterImg).toBeInTheDocument()
    expect(lobsterImg.getAttribute('src')?.startsWith('data:image/svg+xml')).toBe(true)
  })

  it('falls back to lobster SVG still when custom image errors', () => {
    render(
      <ForumAvatar
        src="https://broken-avatar-url.example.com/photo.jpg"
        authorName="Vaelen"
      />
    )

    const customImg = screen.getByTestId('forum-avatar-custom-image')
    expect(customImg).toBeInTheDocument()

    // Trigger image loading failure
    fireEvent.error(customImg)

    expect(screen.queryByTestId('forum-avatar-custom-image')).toBeNull()
    const lobsterImg = screen.getByTestId('forum-avatar-lobster-still')
    expect(lobsterImg).toBeInTheDocument()
    expect(lobsterImg.getAttribute('src')?.startsWith('data:image/svg+xml')).toBe(true)
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
      />
    )

    const lobsterImg = screen.getByTestId('forum-avatar-lobster-still')
    expect(lobsterImg).toBeInTheDocument()
    const src = lobsterImg.getAttribute('src') || ''
    expect(src).toContain('data:image/svg+xml')
  })

  it('applies custom className to the container', () => {
    render(
      <ForumAvatar
        src=""
        authorName="Unit"
        className="w-5 h-5 shadow-sm"
      />
    )

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
