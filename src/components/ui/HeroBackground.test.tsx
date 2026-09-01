import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroBackground } from './HeroBackground'

describe('HeroBackground', () => {
  it('renders chitin texture as CSS backgrounds without an LCP img', () => {
    const { container } = render(<HeroBackground />)
    expect(screen.queryByAltText('Chitin Exoshell Background Texture')).not.toBeInTheDocument()
    const textured = container.querySelectorAll('[style*="chitin_texture_bg"]')
    expect(textured.length).toBeGreaterThanOrEqual(1)
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
