import React from 'react'
import { render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { BrandIcon3D, createBrandEmblemGeometry, parseBrandIconShapes } from './BrandIcon3D'

describe('BrandIcon3D', () => {
  it('parses the canonical 3-part Synaptic Path emblem into centered 3D shapes', () => {
    const shapes = parseBrandIconShapes()
    expect(shapes).toHaveLength(3)

    const geo = createBrandEmblemGeometry()
    geo.computeBoundingBox()
    const bbox = geo.boundingBox!

    // Centered horizontally and vertically around 0 within the [-50, 50] normalized box
    expect(Math.abs((bbox.min.x + bbox.max.x) / 2)).toBeLessThan(0.5)
    expect(Math.abs((bbox.min.y + bbox.max.y) / 2)).toBeLessThan(0.5)
    // Centered on the Z extrusion axis around 0
    expect(Math.abs((bbox.min.z + bbox.max.z) / 2)).toBeLessThan(0.1)
    // Includes both front/back cap group and side/bevel group
    expect(geo.groups.length).toBeGreaterThanOrEqual(2)
    geo.dispose()
  })

  it('renders a decorative 3D container with 2D vector fallback when WebGL is unavailable', () => {
    const { container } = render(<BrandIcon3D size={96} aria-hidden="true" />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('brand-icon-3d')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('exposes role="img" and aria-label when not decorative and supports SSR', () => {
    render(<BrandIcon3D label="3D Order Emblem" />)
    expect(screen.getByRole('img', { name: '3D Order Emblem' })).toBeInTheDocument()

    const html = renderToString(<BrandIcon3D label="3D Order Emblem" />)
    expect(html).toContain('aria-label="3D Order Emblem"')
  })
})
