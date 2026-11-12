import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  BUBBLE_VENTS,
  UnderwaterBubblesCanvas,
  createFpsGovernor,
  mapScenePoint,
  pickBubbleBudget,
  sceneLightAt,
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

    render(<UnderwaterBubblesCanvas bubbleCount={15} />)

    expect(getContextMock).toHaveBeenCalledWith('2d', { alpha: true })
  })

})

describe('scene mapping', () => {
  it('maps painting points like background-size: cover, centred', () => {
    // A 16:9-ish desktop fills the width, so the painting's corners land on the canvas corners horizontally.
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


describe('pickBubbleBudget', () => {
  it('keeps the full scene on desktop, even on low-power hardware', () => {
    expect(pickBubbleBudget(90, { viewportWidth: 1440, hardwareConcurrency: 2, saveData: true })).toEqual({
      count: 90,
      fpsTiers: [36, 24, 18],
    })
  })

  it('caps phones at 26 bubbles and 30fps', () => {
    expect(pickBubbleBudget(90, { viewportWidth: 390, hardwareConcurrency: 8, deviceMemory: 8 })).toEqual({
      count: 26,
      fpsTiers: [30, 24, 18],
    })
  })

  it('drops low-power and data-saver phones to 16 bubbles at 24fps', () => {
    const lowPower = { count: 16, fpsTiers: [24, 18] }
    expect(pickBubbleBudget(90, { viewportWidth: 390, hardwareConcurrency: 4 })).toEqual(lowPower)
    expect(pickBubbleBudget(90, { viewportWidth: 390, deviceMemory: 2 })).toEqual(lowPower)
    expect(pickBubbleBudget(90, { viewportWidth: 390, saveData: true })).toEqual(lowPower)
  })
})

describe('UnderwaterBubblesCanvas animation loop', () => {
  let drawImage: ReturnType<typeof vi.fn>
  let rafCalls: number

  const stubContext = () => {
    drawImage = vi.fn()
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      drawImage,
      getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
      putImageData: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext
  }

  const stubReducedMotion = (reduce: boolean) => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: reduce && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] })
    rafCalls = 0
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((cb: FrameRequestCallback) => {
        rafCalls++
        return setTimeout(() => cb(performance.now()), 16) as unknown as number
      })
    )
    vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)))
    stubContext()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('animates continuously by default', () => {
    stubReducedMotion(false)
    render(<UnderwaterBubblesCanvas bubbleCount={10} />)
    vi.advanceTimersByTime(1000)
    expect(rafCalls).toBeGreaterThan(30)
  })

  it('paints one still frame and stops under reduced motion', () => {
    stubReducedMotion(true)
    render(<UnderwaterBubblesCanvas bubbleCount={10} />)
    vi.advanceTimersByTime(1000)
    expect(rafCalls).toBe(1)
    expect(drawImage).toHaveBeenCalled()
  })

  it('paints one frame then holds while paused, and resumes when unpaused', () => {
    stubReducedMotion(false)
    const { rerender } = render(<UnderwaterBubblesCanvas bubbleCount={10} paused />)
    vi.advanceTimersByTime(1000)
    expect(drawImage).toHaveBeenCalled()
    const pausedCalls = rafCalls
    vi.advanceTimersByTime(1000)
    expect(rafCalls).toBe(pausedCalls)

    rerender(<UnderwaterBubblesCanvas bubbleCount={10} paused={false} />)
    vi.advanceTimersByTime(1000)
    expect(rafCalls).toBeGreaterThan(pausedCalls + 30)
  })

  it('stops when paused mid-animation', () => {
    stubReducedMotion(false)
    const { rerender } = render(<UnderwaterBubblesCanvas bubbleCount={10} />)
    vi.advanceTimersByTime(500)
    rerender(<UnderwaterBubblesCanvas bubbleCount={10} paused />)
    vi.advanceTimersByTime(100)
    const settled = rafCalls
    vi.advanceTimersByTime(1000)
    expect(rafCalls).toBe(settled)
  })
})
