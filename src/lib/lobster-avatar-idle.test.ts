import { describe, it, expect } from 'vitest'
import {
  computeLobsterEyeOffset,
  computeLobsterPupilOffset,
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
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-antennae-layer')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-antenna-left')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-antenna-right')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-brow-layer')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-brow-left')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-brow-right')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-flank-limbs')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-flank-left')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-flank-right')
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

  it('computes per-eye pupil offsets from each socket toward the cursor', () => {
    const rect = { left: 100, top: 100, width: 230, height: 230 }
    const left = computeLobsterPupilOffset(400, 200, rect, 'left')
    const right = computeLobsterPupilOffset(400, 200, rect, 'right')

    expect(left.x).toBeGreaterThan(0)
    expect(right.x).toBeGreaterThan(0)
    expect(left.x).not.toBeCloseTo(right.x)
    expect(left.y).not.toBeCloseTo(right.y)
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
    const target = { x: LOBSTER_EYE_TRACK_RADIUS, y: 0 }
    let current = { x: 0, y: 0 }

    current = stepLobsterEyeOffset(current, target, 0.1)
    expect(current.x).toBeCloseTo(0.1 * LOBSTER_EYE_TRACK_RADIUS)
    expect(current.y).toBe(0)

    for (let i = 0; i < 40; i++) {
      current = stepLobsterEyeOffset(current, target, 0.1)
    }
    expect(current.x).toBeGreaterThan(LOBSTER_EYE_TRACK_RADIUS * 0.75)
    expect(current.x).toBeLessThan(LOBSTER_EYE_TRACK_RADIUS)
  })

  it('moves more slowly when the eyes are close to the target', () => {
    const target = { x: LOBSTER_EYE_TRACK_RADIUS, y: 0 }
    const farStep = stepLobsterEyeOffset({ x: 0, y: 0 }, target, LOBSTER_EYE_TRACK_FOLLOW)
    const nearStep = stepLobsterEyeOffset(
      { x: LOBSTER_EYE_TRACK_RADIUS - 0.1, y: 0 },
      target,
      LOBSTER_EYE_TRACK_FOLLOW
    )

    expect(Math.abs(farStep.x)).toBeGreaterThan(Math.abs(nearStep.x - (LOBSTER_EYE_TRACK_RADIUS - 0.1)))
  })
})
