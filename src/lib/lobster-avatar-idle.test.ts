import { describe, it, expect } from 'vitest'
import {
  decodeSvgDataUri,
  getIdleAnimationPhaseOffset,
  resolveIdleAnimationPhase,
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
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-eyelids-layer')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-eyelid-left')
    expect(LOBSTER_IDLE_LAYER_IDS).toContain('lobster-eyelid-right')
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

  it('caches decoded SVG data URIs in memory', () => {
    const res1 = decodeSvgDataUri(SAMPLE_URI)
    const res2 = decodeSvgDataUri(SAMPLE_URI)
    expect(res1).toBe(SAMPLE_SVG)
    expect(res1).toBe(res2) // Identical cached reference
  })
})
