import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'
import * as pixelateModule from '@/lib/pixelate-avatar'

describe('LobsterAvatarDisplay Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders an image with pixelated styling and alt text', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    render(<LobsterAvatarDisplay src={testSrc} alt="Test Character Avatar" />)

    const img = screen.getByAltText('Test Character Avatar')
    expect(img).toBeInTheDocument()
    expect(img).toHaveClass('[image-rendering:pixelated]')
  })

  it('does not render any crt-pixel-grid overlay div', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    const { container } = render(<LobsterAvatarDisplay src={testSrc} />)

    const gridOverlay = container.querySelector('.crt-pixel-grid')
    expect(gridOverlay).toBeNull()
  })

  it('asynchronously updates to pixelated data URI when available', async () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    const mockPixelated = 'data:image/png;base64,pixelatedLobsterPng'

    vi.spyOn(pixelateModule, 'pixelateImage').mockResolvedValue(mockPixelated)

    render(<LobsterAvatarDisplay src={testSrc} alt="Pixelated Lobster" />)

    await waitFor(() => {
      const img = screen.getByAltText('Pixelated Lobster')
      expect(img.getAttribute('src')).toBe(mockPixelated)
    })
  })

  it('renders masked crt-avatar-scanlines overlay by default', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    render(<LobsterAvatarDisplay src={testSrc} />)

    const scanlines = screen.getByTestId('crt-avatar-scanlines')
    expect(scanlines).toBeInTheDocument()
    expect(scanlines).toHaveClass('crt-avatar-scanlines')
  })

  it('suppresses crt-avatar-scanlines when crt is false', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    render(<LobsterAvatarDisplay src={testSrc} crt={false} />)

    expect(screen.queryByTestId('crt-avatar-scanlines')).toBeNull()
  })

  it('renders ambient glow aura, grain overlay, light source, and vignette by default', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    render(<LobsterAvatarDisplay src={testSrc} glowColor="cyan" terminalEffects={true} />)

    expect(screen.getByTestId('avatar-glow-aura')).toBeInTheDocument()
    expect(screen.getByTestId('crt-avatar-grain')).toBeInTheDocument()
    expect(screen.getByTestId('crt-bg-scanlines')).toBeInTheDocument()
    expect(screen.getByTestId('crt-bg-grain')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-light-source')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-character-light')).toBeInTheDocument()
    expect(screen.getByTestId('avatar-vignette')).toBeInTheDocument()
  })

  it('suppresses vignette when vignette is false', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    render(<LobsterAvatarDisplay src={testSrc} vignette={false} />)

    expect(screen.queryByTestId('avatar-vignette')).toBeNull()
  })

  it('suppresses light source when lightingSource is none', () => {
    const testSrc = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    render(<LobsterAvatarDisplay src={testSrc} lightingSource="none" />)

    expect(screen.queryByTestId('avatar-light-source')).toBeNull()
    expect(screen.queryByTestId('avatar-character-light')).toBeNull()
  })
})
