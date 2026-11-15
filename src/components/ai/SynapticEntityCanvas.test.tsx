import React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SynapticEntityCanvas, computeCoreFraming } from './SynapticEntityCanvas'
import { createOracleEntityBridge } from '@/lib/ai/oracle-entity-bridge'

describe('SynapticEntityCanvas', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the fallback orb in non-WebGL environments and does not register pointer movement handlers', () => {
    const bridge = createOracleEntityBridge()
    render(<SynapticEntityCanvas bridge={bridge} />)

    const container = screen.getByTestId('synaptic-entity-canvas')
    expect(container).toBeInTheDocument()
    expect(screen.getByTestId('synaptic-entity-fallback')).toBeInTheDocument()

    // Ensure pointer movement does not mutate or throw
    fireEvent.pointerMove(container, { clientX: 120, clientY: 80 })
    fireEvent.pointerLeave(container)
    expect(screen.getByTestId('synaptic-entity-fallback')).toBeInTheDocument()
  })
})

describe('computeCoreFraming', () => {
  it('keeps the base view on wide canvases and when not fitting portrait', () => {
    expect(computeCoreFraming(800, 500, true, null)).toEqual({ fov: 45, offsetY: 0 })
    expect(computeCoreFraming(390, 560, false, null)).toEqual({ fov: 45, offsetY: 0 })
  })

  it('sizes the core by width on a tall phone canvas', () => {
    const { fov } = computeCoreFraming(390, 560, true, null)
    expect(fov).toBeGreaterThan(45)
    // Core diameter scales with tan(45/2)/tan(fov/2) of 60% of the height: about 60% of the width.
    const diameter = 0.6 * 560 * (Math.tan((22.5 * Math.PI) / 180) / Math.tan(((fov / 2) * Math.PI) / 180))
    expect(diameter).toBeCloseTo(390 * 0.6, 0)
  })

  it('centers the core in the open space above the chips, never smaller than 42% of the width', () => {
    const framing = computeCoreFraming(390, 560, true, { top: 40, height: 200 })
    // Open space center is 140px from the top, 140px above the canvas middle.
    expect(framing.offsetY).toBeCloseTo(140, 5)
    const tiny = computeCoreFraming(320, 460, true, { top: 40, height: 48 })
    const diameter = 0.6 * 460 * (Math.tan((22.5 * Math.PI) / 180) / Math.tan(((tiny.fov / 2) * Math.PI) / 180))
    expect(diameter).toBeCloseTo(320 * 0.42, 0)
  })
})
