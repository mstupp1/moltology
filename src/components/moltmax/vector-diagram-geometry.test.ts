import { describe, expect, it } from 'vitest'
import { DIAGRAM_CENTER, DIAGRAM_RADIUS, SAMPLE_SHELL, lerpValues, nodePosition, polarPoint, shapeFor, wrapIndex } from './vector-diagram-geometry'

describe('vector diagram geometry', () => {
  it('puts the first axis straight up', () => {
    const [x, y] = polarPoint(0, 100)
    expect(x).toBeCloseTo(DIAGRAM_CENTER)
    expect(y).toBeCloseTo(DIAGRAM_CENTER - DIAGRAM_RADIUS)
  })

  it('pushes only the active vector out and pulls the rest in', () => {
    const shape = shapeFor(2)
    expect(shape[2]).toBe(96)
    shape.forEach((value, index) => {
      if (index !== 2) expect(value).toBeLessThan(SAMPLE_SHELL[index])
    })
    expect(shapeFor(null)).toEqual([...SAMPLE_SHELL])
  })

  it('keeps nodes inside the diagram box', () => {
    for (let i = 0; i < 5; i++) {
      const { left, top } = nodePosition(i)
      for (const pct of [left, top]) {
        const n = parseFloat(pct)
        expect(n).toBeGreaterThan(0)
        expect(n).toBeLessThan(100)
      }
    }
  })

  it('wraps indexes in both directions and interpolates values', () => {
    expect(wrapIndex(-1)).toBe(4)
    expect(wrapIndex(5)).toBe(0)
    expect(lerpValues([0, 100], [100, 0], 0.25)).toEqual([25, 75])
  })
})
