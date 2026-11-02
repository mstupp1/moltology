import { describe, it, expect } from 'vitest'
import {
  decodeSvgDataUri,
  getIdleAnimationPhaseOffset,
  resolveIdleAnimationPhase,
  LOBSTER_IDLE_LAYER_CLASSES,
} from './lobster-avatar-idle'
import { generateLobsterAvatarSvg } from './lobster-avatar'

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="red"/></svg>'
const SAMPLE_URI = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SAMPLE_SVG)}`

describe('lobster-avatar-idle', () => {
  it('lists the idle layer classes every race renders', () => {
    for (const race of ['lobster', 'crab'] as const) {
      const svg = generateLobsterAvatarSvg({ style: 'critters', seed: 'idle-check', race, pose: 'cheer' }, 128)!
      for (const cls of LOBSTER_IDLE_LAYER_CLASSES) {
        if (race === 'crab' && (cls === 'lobster-idle-tail' || cls === 'lobster-idle-flank-limbs' || cls === 'lobster-idle-abdomen')) continue
        expect(svg, `${race} ${cls}`).toContain(cls)
      }
    }
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

describe('local joint rig', () => {
  it('places animated claws and antennae inside static placement groups', () => {
    for (const race of ['lobster', 'crab'] as const) {
      for (const pose of ['rest', 'wave', 'flex', 'cheer'] as const) {
        const svg = generateLobsterAvatarSvg({style: 'critters', seed: 'pivot', race, pose})!
        const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
        for (const part of ['claw-left', 'claw-right', 'antenna-left', 'antenna-right']) {
          const joint = doc.querySelector(`.lobster-idle-${part}`)!
          expect(joint.hasAttribute('transform')).toBe(false)
          expect(joint.parentElement?.getAttribute('transform')).toMatch(/^translate\(/)
          expect(joint.closest('.lobster-idle-carapace')).not.toBeNull()
        }
        expect(doc.querySelector('.lobster-idle-blink rect')).toBeNull()
        expect(doc.querySelector('.lobster-idle-blink path')).not.toBeNull()
      }
    }
  })
})
