import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  BUBBLE_VARIANT_SRCS,
  UnderwaterBubblesCanvas,
  createChromaKeyedSprite,
  createFpsGovernor,
} from './UnderwaterBubblesCanvas'

describe('UnderwaterBubblesCanvas Component', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb) => {
        return setTimeout(cb, 16) as unknown as number
      })
    )
    vi.stubGlobal(
      'cancelAnimationFrame',
      vi.fn((id) => clearTimeout(id))
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders canvas element with proper data-testid and custom className', () => {
    render(<UnderwaterBubblesCanvas bubbleCount={20} className="custom-bubble-class" />)

    const canvas = screen.getByTestId('underwater-bubbles-canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas).toHaveClass('custom-bubble-class')
  })

  it('initializes HTML5 canvas context without throwing errors', () => {
    const getContextMock = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      drawImage: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      }),
    })

    HTMLCanvasElement.prototype.getContext = getContextMock

    render(<UnderwaterBubblesCanvas bubbleCount={15} customBubbleSrc="/images/custom_bubble.png" chromaKeyMode="green" />)

    expect(getContextMock).toHaveBeenCalledWith('2d', { alpha: true })
  })

  it('processes green/black background keying via createChromaKeyedSprite helper', () => {
    const mockImageData = {
      data: new Uint8ClampedArray([
        0, 200, 0, 255, // Green key pixel
        10, 10, 10, 255, // Black key pixel
        255, 255, 255, 255 // White foreground pixel
      ]),
      width: 3,
      height: 1,
    }

    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
      putImageData: vi.fn(),
    }

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)

    const mockCanvas = {
      width: 128,
      height: 128,
    } as unknown as HTMLCanvasElement

    const spriteCanvas = createChromaKeyedSprite(mockCanvas, 'auto')

    expect(spriteCanvas).toBeInstanceOf(HTMLCanvasElement)
    expect(mockCtx.getImageData).toHaveBeenCalledWith(0, 0, 128, 128)
    expect(mockCtx.putImageData).toHaveBeenCalled()
    // Green pixel (index 0) and Black pixel (index 4) alpha channels set to 0, white (index 8) stays 255
    expect(mockImageData.data[3]).toBe(0)
    expect(mockImageData.data[7]).toBe(0)
    expect(mockImageData.data[11]).toBe(255)
  })

  it('correctly keys only black pixels when chromaKeyMode="black"', () => {
    const mockImageData = {
      data: new Uint8ClampedArray([
        0, 200, 0, 255, // Green pixel (should NOT be keyed when mode is black)
        10, 10, 10, 255, // Black pixel (should be keyed)
        255, 255, 255, 255 // White foreground pixel (should NOT be keyed)
      ]),
      width: 3,
      height: 1,
    }

    const mockCtx = {
      drawImage: vi.fn(),
      getImageData: vi.fn().mockReturnValue(mockImageData),
      putImageData: vi.fn(),
    }

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx)

    const mockCanvas = {
      width: 128,
      height: 128,
    } as unknown as HTMLCanvasElement

    createChromaKeyedSprite(mockCanvas, 'black')

    expect(mockImageData.data[3]).toBe(255) // Green pixel stays opaque
    expect(mockImageData.data[7]).toBe(0)   // Black pixel becomes transparent
    expect(mockImageData.data[11]).toBe(255) // White pixel stays opaque
  })

})

describe('BUBBLE_VARIANT_SRCS', () => {
  it('exposes a stable module-level array of the three variant assets', () => {
    expect(BUBBLE_VARIANT_SRCS).toEqual([
      '/images/bubble_variant_1.jpg',
      '/images/bubble_variant_2.jpg',
      '/images/bubble_variant_3.jpg',
    ])
    expect(BUBBLE_VARIANT_SRCS).toBe(BUBBLE_VARIANT_SRCS)
  })
})

describe('createFpsGovernor', () => {
  const HEALTHY_RAF_DELTA = 1000 / 60 // 60Hz vsync cadence

  it('starts at tier 0 with the highest target interval', () => {
    const governor = createFpsGovernor([36, 24, 18])

    expect(governor.tierIndex).toBe(0)
    expect(governor.intervalMs).toBeCloseTo(1000 / 36)
  })

  it('never leaves tier 0 under sustained healthy load', () => {
    const governor = createFpsGovernor([36, 24, 18])

    for (let i = 0; i < 600; i++) {
      const sample = governor.sample(2, HEALTHY_RAF_DELTA)
      expect(sample.downgraded).toBe(false)
      expect(sample.upgraded).toBe(false)
      expect(sample.cullRequested).toBe(false)
    }

    expect(governor.tierIndex).toBe(0)
  })

  it('downgrades one tier after sustained render overload', () => {
    const governor = createFpsGovernor([36, 24, 18])

    let downgraded = false
    for (let i = 0; i < 60; i++) {
      const sample = governor.sample(40, HEALTHY_RAF_DELTA) // 40ms work vs 27.8ms budget
      if (sample.downgraded) downgraded = true
    }

    expect(downgraded).toBe(true)
    expect(governor.tierIndex).toBe(1)
    expect(governor.intervalMs).toBeCloseTo(1000 / 24)
  })

  it('reaches the floor tier on sustained struggle and requests the far-fizz cull exactly once', () => {
    const governor = createFpsGovernor([36, 24, 18])

    let cullRequests = 0
    for (let i = 0; i < 220; i++) {
      const sample = governor.sample(80, HEALTHY_RAF_DELTA)
      if (sample.cullRequested) cullRequests++
    }

    expect(governor.tierIndex).toBe(2)
    expect(governor.intervalMs).toBeCloseTo(1000 / 18)
    expect(cullRequests).toBe(1)
  })

  it('upgrades back after sustained headroom at a lower tier', () => {
    const governor = createFpsGovernor([36, 24, 18])

    // Drive into tier 1
    for (let i = 0; i < 60; i++) governor.sample(40, HEALTHY_RAF_DELTA)
    expect(governor.tierIndex).toBe(1)

    // Sustained easy frames (~5s worth at 36fps)
    let upgraded = false
    for (let i = 0; i < 300; i++) {
      const sample = governor.sample(2, HEALTHY_RAF_DELTA)
      if (sample.upgraded) upgraded = true
    }

    expect(upgraded).toBe(true)
    expect(governor.tierIndex).toBe(0)
  })

  it('holds tier under borderline load without oscillating (hysteresis)', () => {
    const governor = createFpsGovernor([36, 24, 18])

    // Drive into tier 1
    for (let i = 0; i < 60; i++) governor.sample(40, HEALTHY_RAF_DELTA)
    expect(governor.tierIndex).toBe(1)

    // 45ms work: below tier-1 breach threshold (41.7 * 1.2 = 50) but far
    // above the tier-0 calm threshold (27.8 * 0.5 = 13.9) -> hold steady
    for (let i = 0; i < 400; i++) {
      const sample = governor.sample(45, HEALTHY_RAF_DELTA)
      expect(sample.downgraded).toBe(false)
      expect(sample.upgraded).toBe(false)
    }

    expect(governor.tierIndex).toBe(1)
  })

  it('downgrades on rAF cadence starvation even when draw work is cheap (GPU saturation)', () => {
    const governor = createFpsGovernor([36, 24, 18])

    let downgraded = false
    for (let i = 0; i < 120; i++) {
      // Saturated GPU: most vsyncs are missed, occasional fast frame keeps
      // the observed vsync floor at 60Hz
      const rafDelta = i % 3 === 2 ? HEALTHY_RAF_DELTA : 60
      const sample = governor.sample(1, rafDelta)
      if (sample.downgraded) downgraded = true
    }

    expect(downgraded).toBe(true)
    expect(governor.tierIndex).toBeGreaterThan(0)
  })

  it('ignores long stalls (tab suspension) without false-positive downgrades', () => {
    const governor = createFpsGovernor([36, 24, 18])

    for (let i = 0; i < 300; i++) {
      const rafDelta = i % 50 === 0 ? 2000 : HEALTHY_RAF_DELTA // periodic suspension
      governor.sample(2, rafDelta)
    }

    expect(governor.tierIndex).toBe(0)
  })

  it('supports mobile tiers starting at 30fps', () => {
    const governor = createFpsGovernor([30, 24, 18])

    expect(governor.intervalMs).toBeCloseTo(1000 / 30)

    for (let i = 0; i < 60; i++) governor.sample(50, HEALTHY_RAF_DELTA)

    expect(governor.tierIndex).toBe(1)
    expect(governor.intervalMs).toBeCloseTo(1000 / 24)
  })
})

