import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroBackground } from './HeroBackground'

describe('HeroBackground', () => {
  it('renders chitin texture and background layers', () => {
    render(<HeroBackground />)
    const textureImg = screen.getByAltText('Chitin Exoshell Background Texture')
    expect(textureImg).toBeInTheDocument()
    expect(textureImg.getAttribute('src')).toContain('/images/chitin_texture_bg.webp')
  })

  it('renders custom watermarks when enabled', () => {
    render(
      <HeroBackground
        showWatermarks={true}
        leftWatermark="TEST // LEFT_BEACON"
        rightWatermark="TEST // RIGHT_DATUM"
      />,
    )
    expect(screen.getByText('TEST // LEFT_BEACON')).toBeInTheDocument()
    expect(screen.getByText('TEST // RIGHT_DATUM')).toBeInTheDocument()
  })

  it('hides watermarks when showWatermarks is false', () => {
    render(
      <HeroBackground
        showWatermarks={false}
        leftWatermark="SECRET // LEFT"
        rightWatermark="SECRET // RIGHT"
      />,
    )
    expect(screen.queryByText('SECRET // LEFT')).not.toBeInTheDocument()
    expect(screen.queryByText('SECRET // RIGHT')).not.toBeInTheDocument()
  })
})
