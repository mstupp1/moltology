import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroBackground } from './HeroBackground'

describe('HeroBackground', () => {
  it('mounts deferred chitin textures (idle-ready in tests) without an LCP img', async () => {
    const { container } = render(<HeroBackground />)
    expect(screen.queryByAltText('Chitin Exoshell Background Texture')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(container.querySelector('[data-testid="hero-chitin-texture-sm"]')).toBeTruthy()
    })
    expect(container.querySelector('[style*="chitin_texture_bg"]')).toBeTruthy()
  })

  it('renders custom watermarks when enabled', () => {
    render(
      <HeroBackground
        showWatermarks={true}
        leftWatermark="TEST · LEFT_BEACON"
        rightWatermark="TEST · RIGHT_DATUM"
      />,
    )
    expect(screen.getByText('TEST · LEFT_BEACON')).toBeInTheDocument()
    expect(screen.getByText('TEST · RIGHT_DATUM')).toBeInTheDocument()
  })

  it('hides watermarks when showWatermarks is false', () => {
    render(
      <HeroBackground
        showWatermarks={false}
        leftWatermark="SECRET · LEFT"
        rightWatermark="SECRET · RIGHT"
      />,
    )
    expect(screen.queryByText('SECRET · LEFT')).not.toBeInTheDocument()
    expect(screen.queryByText('SECRET · RIGHT')).not.toBeInTheDocument()
  })
})
