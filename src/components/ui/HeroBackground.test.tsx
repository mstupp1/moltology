import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { HeroBackground } from './HeroBackground'

describe('HeroBackground', () => {
  it('paints mobile chitin as an eager high-priority img on first render', () => {
    const { container } = render(<HeroBackground />)
    const mobileChitin = screen.getByTestId('hero-chitin-texture-sm')
    expect(mobileChitin.tagName).toBe('IMG')
    expect(mobileChitin).toHaveAttribute('fetchpriority', 'high')
    expect(mobileChitin).toHaveAttribute('loading', 'eager')
    expect(container.querySelector('[data-testid="hero-chitin-texture-lg"]')).toBeTruthy()
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
