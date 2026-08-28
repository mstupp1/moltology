import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LobsterAvatarPortrait } from './LobsterAvatarPortrait'

const testSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="cyan"/></svg>'
const testSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(testSvg)}`

function mockMatchMedia(reducedMotion = false) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)' ? reducedMotion : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('LobsterAvatarPortrait Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockMatchMedia(false)
  })

  it('renders avatar display, foreground lens vignette, specular sheen, and bezel by default', () => {
    render(<LobsterAvatarPortrait src={testSrc} alt="Test Carapace" />)

    expect(screen.getByTestId('portrait-lens-vignette')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-lens-sheen')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-lens-bezel')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-fisheye-dome')).toBeInTheDocument()
    expect(screen.getByTestId('portrait-fisheye-chromatic')).toBeInTheDocument()
    expect(screen.getByTestId('lobster-avatar-inline-svg')).toBeInTheDocument()
  })

  it('allows disabling fisheye lens effect', () => {
    render(<LobsterAvatarPortrait src={testSrc} fisheyeLens={false} />)

    expect(screen.queryByTestId('portrait-fisheye-dome')).toBeNull()
    expect(screen.queryByTestId('portrait-fisheye-chromatic')).toBeNull()
    expect(screen.getByTestId('lobster-avatar-inline-svg')).toBeInTheDocument()
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

  it('renders "No avatar" fallback when no src or config is provided', () => {
    render(<LobsterAvatarPortrait />)

    expect(screen.getByText(/No avatar/i)).toBeInTheDocument()
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
  })
})
