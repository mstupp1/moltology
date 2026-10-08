import { describe, expect, it } from 'vitest'
import { buildShell, mulberry32 } from './shell'

describe('buildShell', () => {
  it('builds the requested number of points, centred and normalised', () => {
    const shell = buildShell(1500)
    expect(shell.count).toBe(1500)
    let maxAbs = 0
    for (let i = 0; i < shell.count; i++) {
      maxAbs = Math.max(maxAbs, Math.abs(shell.x[i]), Math.abs(shell.y[i]), Math.abs(shell.z[i]))
      expect(Number.isFinite(shell.x[i] + shell.y[i] + shell.z[i])).toBe(true)
    }
    expect(maxAbs).toBeCloseTo(1, 5)
  })

  it('is deterministic for a seed', () => {
    const a = buildShell(400, 3)
    const b = buildShell(400, 3)
    expect(Array.from(a.x)).toEqual(Array.from(b.x))
    expect(Array.from(a.order)).toEqual(Array.from(b.order))
  })

  it('grows head first and keeps order, light and normals in range', () => {
    const shell = buildShell(2000)
    let headOrder = 0
    let headCount = 0
    let tailOrder = 0
    let tailCount = 0
    for (let i = 0; i < shell.count; i++) {
      expect(shell.order[i]).toBeGreaterThanOrEqual(0)
      expect(shell.order[i]).toBeLessThanOrEqual(1)
      expect(shell.rim[i]).toBeGreaterThan(0)
      expect(shell.rim[i]).toBeLessThanOrEqual(1)
      const len = Math.hypot(shell.nx[i], shell.ny[i], shell.nz[i])
      expect(len === 0 || Math.abs(len - 1) < 1e-4).toBe(true)
      if (shell.along[i] < 0.2) {
        headOrder += shell.order[i]
        headCount++
      } else if (shell.along[i] > 0.85) {
        tailOrder += shell.order[i]
        tailCount++
      }
    }
    expect(headOrder / headCount).toBeLessThan(tailOrder / tailCount)
  })

  it('handles an empty cloud', () => {
    expect(buildShell(0).count).toBe(0)
  })
})

describe('mulberry32', () => {
  it('returns numbers in [0, 1)', () => {
    const rand = mulberry32(1)
    for (let i = 0; i < 100; i++) {
      const v = rand()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
