import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  BUBBLE_VENTS,
  UnderwaterBubbles,
  mapScenePoint,
  pickBubbleCount,
  planBubbleRise,
  sceneLightAt,
} from './UnderwaterBubbles'

describe('scene mapping', () => {
  it('maps painting points like background-size: cover, centred', () => {
    const [x0] = mapScenePoint(0, 0.5, 1672, 941)
    const [x1, y1] = mapScenePoint(1, 1, 1672, 941)
    expect(x0).toBeCloseTo(0)
    expect(x1).toBeCloseTo(1672)
    expect(y1).toBeCloseTo(941)
    // A tall phone crops the sides, so the left vent falls off screen and the sub stays near the middle.
    const [ventX] = mapScenePoint(BUBBLE_VENTS[0].x, BUBBLE_VENTS[0].y, 390, 844)
    const [subX] = mapScenePoint(0.51, 0.84, 390, 844)
    expect(ventX).toBeLessThan(0)
    expect(subX).toBeGreaterThan(150)
    expect(subX).toBeLessThan(250)
  })

  it('puts the most light in the shafts at the top centre', () => {
    expect(sceneLightAt(720, 0, 1440, 900)).toBeGreaterThan(sceneLightAt(720, 800, 1440, 900))
    expect(sceneLightAt(720, 100, 1440, 900)).toBeGreaterThan(sceneLightAt(100, 100, 1440, 900))
  })
})

describe('pickBubbleCount', () => {
  it('keeps the full scene on desktop, even on low-power hardware', () => {
    expect(pickBubbleCount(32, { viewportWidth: 1440, hardwareConcurrency: 2, saveData: true })).toBe(32)
  })

  it('caps phones at 16 bubbles', () => {
    expect(pickBubbleCount(32, { viewportWidth: 390, hardwareConcurrency: 8, deviceMemory: 8 })).toBe(16)
  })

  it('drops low-power and data-saver phones to 10 bubbles', () => {
    expect(pickBubbleCount(32, { viewportWidth: 390, hardwareConcurrency: 4 })).toBe(10)
    expect(pickBubbleCount(32, { viewportWidth: 390, deviceMemory: 2 })).toBe(10)
    expect(pickBubbleCount(32, { viewportWidth: 390, saveData: true })).toBe(10)
  })
})

describe('planBubbleRise', () => {
  const seeded = (seed: number) => () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }

  it('rises past the top of the scene with a sane size, speed and opacity', () => {
    const random = seeded(7)
    for (let i = 0; i < 200; i++) {
      const rise = planBubbleRise(1440, 900, random)
      expect(rise.distance).toBeGreaterThan(rise.y)
      expect(rise.size).toBeGreaterThan(4)
      expect(rise.size).toBeLessThan(130)
      expect(rise.opacity).toBeGreaterThan(0.3)
      expect(rise.opacity).toBeLessThanOrEqual(0.9)
      // Between about 3 and 60 seconds from start to surface.
      expect(rise.durationMs).toBeGreaterThan(3000)
      expect(rise.durationMs).toBeLessThan(60000)
    }
  })

  it('starts most bubbles at the vents', () => {
    const random = seeded(11)
    const vents = BUBBLE_VENTS.map((vent) => mapScenePoint(vent.x, vent.y, 1440, 900))
    let fromVent = 0
    for (let i = 0; i < 400; i++) {
      const rise = planBubbleRise(1440, 900, random)
      if (vents.some(([x, y]) => Math.abs(rise.x - x) <= 9 && Math.abs(rise.y - y) < 1)) fromVent++
    }
    expect(fromVent / 400).toBeGreaterThan(0.5)
    expect(fromVent / 400).toBeLessThan(0.8)
  })

  it('uses the soft sprite for far bubbles and beads for tiny ones', () => {
    const random = seeded(3)
    const sprites = new Set<string>()
    for (let i = 0; i < 300; i++) sprites.add(planBubbleRise(1440, 900, random).sprite)
    expect([...sprites].sort()).toEqual(['bead', 'glass', 'soft'])
  })
})

describe('UnderwaterBubbles', () => {
  interface FakeAnimation {
    currentTime: number
    onfinish: (() => void) | null
    play: ReturnType<typeof vi.fn>
    pause: ReturnType<typeof vi.fn>
    cancel: ReturnType<typeof vi.fn>
  }
  let animations: FakeAnimation[]

  const stubReducedMotion = (reduce: boolean) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: reduce && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    )
  }

  beforeEach(() => {
    animations = []
    Element.prototype.animate = vi.fn(() => {
      const animation: FakeAnimation = { currentTime: 0, onfinish: null, play: vi.fn(), pause: vi.fn(), cancel: vi.fn() }
      animations.push(animation)
      return animation as unknown as Animation
    }) as unknown as typeof Element.prototype.animate
    stubReducedMotion(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders one image per bubble, each with a rise and a sway', () => {
    render(<UnderwaterBubbles bubbleCount={12} className="custom-bubble-class" />)
    const layer = screen.getByTestId('underwater-bubbles')
    expect(layer).toHaveClass('custom-bubble-class')
    expect(layer.querySelectorAll('img')).toHaveLength(12)
    expect(animations).toHaveLength(24)
  })

  it('starts a new rise when a bubble reaches the surface', () => {
    render(<UnderwaterBubbles bubbleCount={2} />)
    const firstRise = animations[0]
    firstRise.onfinish?.()
    expect(firstRise.cancel).toHaveBeenCalled()
    expect(animations).toHaveLength(6)
  })

  it('pauses every animation while covered and plays them again after', () => {
    const { rerender } = render(<UnderwaterBubbles bubbleCount={3} />)
    rerender(<UnderwaterBubbles bubbleCount={3} paused />)
    expect(animations.every((a) => a.pause.mock.calls.length === 1)).toBe(true)
    rerender(<UnderwaterBubbles bubbleCount={3} paused={false} />)
    expect(animations.every((a) => a.play.mock.calls.length === 1)).toBe(true)
  })

  it('places still bubbles without animating under reduced motion', () => {
    stubReducedMotion(true)
    render(<UnderwaterBubbles bubbleCount={5} />)
    expect(animations).toHaveLength(0)
    const wraps = screen.getByTestId('underwater-bubbles').querySelectorAll<HTMLElement>('.scene-bubble')
    expect(wraps).toHaveLength(5)
    expect(Number(wraps[0].style.opacity)).toBeGreaterThan(0)
  })

  it('renders nothing when disabled', () => {
    render(<UnderwaterBubbles disabled />)
    expect(screen.queryByTestId('underwater-bubbles')).toBeNull()
  })

  it('stops every animation on unmount', () => {
    const { unmount } = render(<UnderwaterBubbles bubbleCount={4} />)
    unmount()
    expect(animations.every((a) => a.cancel.mock.calls.length >= 1)).toBe(true)
  })
})
