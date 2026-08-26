import { describe, it, expect } from 'vitest'
import {
  computeLobsterEyeOffset,
  decodeSvgDataUri,
  getIdleAnimationPhaseOffset,
  resolveIdleAnimationPhase,
  stepLobsterEyeOffset,
  LOBSTER_EYE_TRACK_FOLLOW,
  LOBSTER_EYE_TRACK_RADIUS,
  LOBSTER_IDLE_LAYER_IDS,
} from './lobster-avatar-idle'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>'
const SAMPLE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`

describe('lobster-avatar-idle', () => {
  it('exports expected idle layer ids', () => {
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-carapace-layer')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-claw-left')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-claw-right')
  })

  it('decodes percent-encoded svg data uris', () => {
    expect(decodeSvgDataUri(SAMPLE_URI)).toBe(SAMPLE_SVG)
  })

  it('returns null for non-svg sources', () => {
    expect(decodeSvgDataUri('data:image/png;base64,abc')).toBeNull()
    expect(decodeSvgDataUri('')).toBeNull()
  })

  it('computes deterministic phase offset from seed', () => {
    const a = getIdleAnimationPhaseOffset('larva-alpha')
    const b = getIdleAnimationPhaseOffset('larva-alpha')
    const c = getIdleAnimationPhaseOffset('larva-beta')

    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(1)
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })

  it('resolves phase from explicit seed or svg fallback', () => {
    const fromSeed = resolveIdleAnimationPhase(SAMPLE_SVG, 'larva-alpha')
    const fromSvg = resolveIdleAnimationPhase(SAMPLE_SVG)

    expect(fromSeed).toBe(getIdleAnimationPhaseOffset('larva-alpha'))
    expect(fromSvg).toBe(getIdleAnimationPhaseOffset(SAMPLE_SVG))
  })

  it('computes radial eye offsets toward cursor relative to avatar center', () => {
    const rect = { left: 100, top: 100, width: 200, height: 200 }
    const r = LOBSTER_EYE_TRACK_RADIUS
    const diag = r / Math.SQRT2

    expect(computeLobsterEyeOffset(200, 200, rect)).toEqual({ x: 0, y: 0 })
    expect(computeLobsterEyeOffset(300, 200, rect)).toEqual({ x: r, y: 0 })
    expect(computeLobsterEyeOffset(200, 300, rect)).toEqual({ x: 0, y: r })
    expect(computeLobsterEyeOffset(500, 500, rect)).toEqual({ x: diag, y: diag })
  })

  it('eases eye offset toward target with resistance instead of snapping', () => {
    const target = { x: 2, y: 0 }
    let current = { x: 0, y: 0 }

    current = stepLobsterEyeOffset(current, target, 0.1)
    expect(current.x).toBeCloseTo(0.2)
    expect(current.y).toBe(0)

    for (let i = 0; i < 40; i++) {
      current = stepLobsterEyeOffset(current, target, 0.1)
    }
    expect(current.x).toBeGreaterThan(1.5)
    expect(current.x).toBeLessThan(2)
  })

  it('moves more slowly when the eyes are close to the target', () => {
    const target = { x: 2, y: 0 }
    const farStep = stepLobsterEyeOffset({ x: 0, y: 0 }, target, LOBSTER_EYE_TRACK_FOLLOW)
    const nearStep = stepLobsterEyeOffset({ x: 1.9, y: 0 }, target, LOBSTER_EYE_TRACK_FOLLOW)

    expect(Math.abs(farStep.x)).toBeGreaterThan(Math.abs(nearStep.x - 1.9))
  })
})
