import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LobsterAvatarPortrait } from './LobsterAvatarPortrait'

const testSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="cyan"/></svg>'
const testSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(testSvg)}`

describe('LobsterAvatarPortrait Component', () => {
  it('renders a static portrait image with lens chrome and never mounts animated full-body', () => {
    render(<LobsterAvatarPortrait src={testSrc} alt="Test Carapace" />)

    expect(screen.getByTestId('lobster-avatar-portrait')).toHaveAttribute('data-slot', 'portrait')
    expect(screen.getByTestId('portrait-lens-vignette')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-lens-sheen')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-lens-bezel')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-fisheye-dome')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-fisheye-chromatic')).toBeInTheDocument()
    const img = screen.getByTestId('lobster-avatar-portrait-image')
    expect(img).toHaveAttribute('src', testSrc)
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
    expect(screen.queryByTestId('lobster-avatar-full-body')).toBeNull()
  })

  it('allows disabling fisheye lens effect', () => {
    render(<LobsterAvatarPortrait src={testSrc} fisheyeLens={false} />)

    expect(screen.queryByTestId('portrait-fisheye-dome')).toBeNull()
    expect(screen.queryByTestId('portrait-fisheye-chromatic')).toBeNull()
    expect(screen.getByTestId('lobster-avatar-portrait-image')).toBeInTheDocument()
  })

  it('allows disabling foreground lens vignette', () => {
    render(<LobsterAvatarPortrait src={testSrc} vignette={false} />)

    expect(screen.queryByTestId('portrait-lens-vignette')).toBeNull()
    expect(screen.getByTestId('portrait-lens-sheen')).toBeInTheDocument()
  })

  it('allows disabling specular sheen', () => {
    render(<LobsterAvatarPortrait src={testSrc} specularSheen={false} />)

    expect(screen.queryByTestId('portrait-lens-sheen')).toBeNull()
    expect(screen.getByTestId('portrait-lens-vignette')).toBeInTheDocument()
  })

  it('renders carapace silhouette with antennae when no src or config is provided', () => {
    render(<LobsterAvatarPortrait />)

    expect(screen.getByTestId('lobster-avatar-silhouette')).toBeInTheDocument()
    expect(screen.queryByText(/No avatar/i)).toBeNull()
    expect(screen.queryByTestId('lobster-avatar-portrait-image')).toBeNull()
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
  })

  it('generates a static portrait slot from config', () => {
    render(
      <LobsterAvatarPortrait
        config={{ style: 'critters', seed: 'portrait-row' }}
        size={64}
        alt="Row face"
      />
    )

    const img = screen.getByTestId('lobster-avatar-portrait-image')
    expect(img.getAttribute('src') ?? '').toContain('data:image/svg+xml')
    expect(decodeURIComponent(img.getAttribute('src') ?? '')).toContain('data-avatar-slot="portrait"')
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
  })

  it('eager-loads when asked (signed-in HUD face)', () => {
    render(<LobsterAvatarPortrait src={testSrc} loading="eager" alt="Own face" />)
    expect(screen.getByTestId('lobster-avatar-portrait-image')).toHaveAttribute('loading', 'eager')
  })

  it('renders animated porthole display when animated={true}', () => {
    render(
      <LobsterAvatarPortrait
        config={{ style: 'critters', seed: 'moving-hero' }}
        size={256}
        animated
        alt="Moving hero"
      />
    )

    expect(screen.getByTestId('lobster-avatar-portrait')).toHaveAttribute('data-animated', 'true')
    expect(screen.queryByTestId('lobster-avatar-portrait-image')).toBeNull()
  })
})
