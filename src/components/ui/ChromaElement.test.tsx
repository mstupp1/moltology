import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ChromaElement } from './ChromaElement'

describe('ChromaElement', () => {
  it('renders image with correct src and alt attributes', () => {
    render(<ChromaElement src="/images/extracted/cyber_lobster_3d_chroma.jpg" alt="Cyber Lobster 3D" />)
    const img = screen.getByAltText('Cyber Lobster 3D')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/extracted/cyber_lobster_3d_chroma.jpg')
  })

  it('applies screen mix-blend-mode by default', () => {
    render(<ChromaElement src="/test.png" alt="Test Graphic" />)
    const img = screen.getByAltText('Test Graphic')
    expect(img.style.mixBlendMode).toBe('screen')
  })

  it('applies custom blend mode when specified', () => {
    render(<ChromaElement src="/test.png" alt="Test Graphic" blendMode="lighten" />)
    const img = screen.getByAltText('Test Graphic')
    expect(img.style.mixBlendMode).toBe('lighten')
  })
})
