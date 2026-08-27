import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LobsterAvatarDisplay } from './LobsterAvatarDisplay'
import * as pixelateModule from '@/lib/pixelate-avatar'
import { generateLobsterAvatarDataUri } from '@/lib/lobster-avatar'

const testSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>'
const testSrc = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(testSvg)}`

function mockMatchMedia(reducedMotion: boolean) {
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

describe('LobsterAvatarDisplay Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockMatchMedia(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders inline animated svg by default for svg data uris', () => {
    render(<LobsterAvatarDisplay src={testSrc} alt="Test Character Avatar" />)

    const inlineSvg = screen.getByTestId('lobster-avatar-inline-svg')
    expect(inlineSvg).toBeInTheDocument()
    expect(inlineSvg).toHaveClass('lobster-avatar-animated')
    expect(inlineSvg).toHaveAttribute('aria-label', 'Test Character Avatar')
    expect(screen.queryByAltText('Test Character Avatar')).toBeNull()
  })

  it('renders pixelated img when animated is false', () => {
    render(<LobsterAvatarDisplay src={testSrc} alt="Test Character Avatar" animated={false} />)

    const img = screen.getByAltText('Test Character Avatar')
    expect(img).toBeInTheDocument()
    expect(img).toHaveClass('[image-rendering:pixelated]')
    expect(screen.queryByTestId('lobster-avatar-inline-svg')).toBeNull()
  })

  it('does not render any crt-pixel-grid overlay div', () => {
    const { container } = render(<LobsterAvatarDisplay src={testSrc} />)

    const gridOverlay = container.querySelector('.crt-pixel-grid')
    expect(gridOverlay).toBeNull()
  })

  it('asynchronously updates to pixelated data URI when reduced motion is enabled', async () => {
    mockMatchMedia(true)
    const mockPixelated = 'data:image/png;base64,pixelatedLobsterPng'

    vi.spyOn(pixelateModule, 'pixelateImage').mockResolvedValue(mockPixelated)

    render(<LobsterAvatarDisplay src={testSrc} alt="Pixelated Lobster" />)

    await waitFor(() => {
      const img = screen.getByAltText('Pixelated Lobster')
      expect(img.getAttribute('src')).toBe(mockPixelated)
    })
  })

  it('renders masked crt-avatar-scanlines overlay by default', () => {
    render(<LobsterAvatarDisplay src={testSrc} />)

    const scanlines = screen.getByTestId('crt-avatar-scanlines')
    expect(scanlines).toBeInTheDocument()
    expect(scanlines).toHaveClass('crt-avatar-scanlines')
  })

  it('suppresses crt-avatar-scanlines when crt is false', () => {
    render(<LobsterAvatarDisplay src={testSrc} crt={false} />)

    expect(screen.queryByTestId('crt-avatar-scanlines')).toBeNull()
  })

  it('renders ambient glow aura, grain overlay, light source, and vignette by default', () => {
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
    render(<LobsterAvatarDisplay src={testSrc} vignette={false} />)

    expect(screen.queryByTestId('avatar-vignette')).toBeNull()
  })

  it('suppresses light source when lightingSource is none', () => {
    render(<LobsterAvatarDisplay src={testSrc} lightingSource="none" />)

    expect(screen.queryByTestId('avatar-light-source')).toBeNull()
    expect(screen.queryByTestId('avatar-character-light')).toBeNull()
  })

  it('applies eased pupil tracking transform on each svg pupil layer', async () => {
    const avatarSrc = generateLobsterAvatarDataUri({ style: 'critters', seed: 'eye-variant-5' }, 256)
    expect(avatarSrc).toBeTruthy()

    render(<LobsterAvatarDisplay src={avatarSrc!} eyeTracking animated />)

    const inlineSvg = screen.getByTestId('lobster-avatar-inline-svg')
    const leftPupil = inlineSvg.querySelector('#lobster-pupil-left')
    const rightPupil = inlineSvg.querySelector('#lobster-pupil-right')
    const eyesLayer = inlineSvg.querySelector('#lobster-eyes-layer')
    expect(leftPupil).toBeTruthy()
    expect(rightPupil).toBeTruthy()
    expect(eyesLayer).toBeTruthy()

    fireEvent.mouseMove(window, { clientX: 9999, clientY: 9999 })

    await waitFor(() => {
      const leftTransform = (leftPupil as SVGGraphicsElement).style.transform
      const rightTransform = (rightPupil as SVGGraphicsElement).style.transform
      expect(leftTransform).toMatch(/translate\(.+px, .+px\)/)
      expect(rightTransform).toMatch(/translate\(.+px, .+px\)/)
      expect(leftTransform).not.toBe(rightTransform)
      expect((eyesLayer as SVGGraphicsElement).style.transform).toBe('')
    })
  })

  it('renders PBR surface texture underlay when texture prop is provided', () => {
    render(<LobsterAvatarDisplay src={testSrc} texture="carbon" />)

    const textureEl = screen.getByTestId('avatar-pbr-texture')
    expect(textureEl).toBeInTheDocument()
    expect(textureEl).toHaveClass('pbr-underlay-carbon')
  })

  it('extracts and renders PBR surface texture underlay from SVG data-texture', () => {
    const avatarSrc = generateLobsterAvatarDataUri({ style: 'critters', seed: 'test-seed', backgroundTexture: 'hex' }, 256)
    render(<LobsterAvatarDisplay src={avatarSrc!} />)

    const textureEl = screen.getByTestId('avatar-pbr-texture')
    expect(textureEl).toBeInTheDocument()
    expect(textureEl).toHaveClass('pbr-underlay-hex')
  })
})
