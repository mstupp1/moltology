import { describe, it, expect } from 'vitest'
import { computeGearTooltipPosition } from './gear-tooltip-position'

describe('computeGearTooltipPosition', () => {
  const tooltip = { width: 288, height: 200 }
  const viewport = { width: 1200, height: 800 }

  it('places tooltip to the right of the anchor by default', () => {
    const anchor = { top: 100, left: 200, right: 280, bottom: 260 }
    const pos = computeGearTooltipPosition(anchor, tooltip, viewport)
    expect(pos.left).toBe(292)
    expect(pos.top).toBe(100)
  })

  it('flips to the left when there is no room on the right', () => {
    const anchor = { top: 100, left: 900, right: 980, bottom: 260 }
    const pos = computeGearTooltipPosition(anchor, tooltip, viewport)
    expect(pos.left).toBe(600)
    expect(pos.top).toBe(100)
  })

  it('clamps vertically when the tooltip would overflow the bottom edge', () => {
    const anchor = { top: 700, left: 200, right: 280, bottom: 860 }
    const pos = computeGearTooltipPosition(anchor, tooltip, viewport)
    expect(pos.top).toBe(592)
  })
})
