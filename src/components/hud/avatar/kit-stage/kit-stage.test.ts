import { describe, expect, it } from 'vitest'
import { LOBSTER_AVATAR_STYLE, buildAvatarSvg, type LobsterAvatarConfig } from '@/lib/lobster-avatar'
import { parseKitStageScene, wornHrefs } from './layers'
import { BLINK_SECONDS, StageMotion, apply, blinkAlpha, breath, multiply, poseMatrix } from './motion'

const kitSvg = (overrides: Partial<LobsterAvatarConfig> = {}) =>
  buildAvatarSvg(
    { style: LOBSTER_AVATAR_STYLE, seed: 'stage-test', race: 'lobster', kit: true, ...overrides },
    360,
    'fullBody',
    `stage-${overrides.loadout ?? ''}`,
    { kit: true, kitHref: (a) => `/media/${a.src}` }
  )

describe('kit stage scene', () => {
  it('splits the painted character into the idle groups the CSS animates', () => {
    const scene = parseKitStageScene(kitSvg())!
    expect(scene).not.toBeNull()
    expect(scene.viewBox).toEqual([-65, -35, 230, 230])
    const anims = scene.nodes.map((n) => n.anim)
    expect(anims[0]).toBe('root')
    for (const anim of ['carapace', 'antenna-left', 'antenna-right', 'claw-left', 'claw-right', 'eyes', 'iris', 'blink']) {
      expect(anims).toContain(anim)
    }
    // Every node's parent comes before it, so world transforms can be built in one pass.
    scene.nodes.forEach((n, i) => expect(n.parent).toBeLessThan(i))
    // Every image lands in exactly one run, in paint order.
    const images = (kitSvg().match(/<image /g) ?? []).length - (scene.backdrop?.match(/<image /g) ?? []).length
    expect(scene.runs.reduce((sum, r) => sum + (r.markup.match(/<image /g) ?? []).length, 0)).toBe(images)
  })

  it('reads inline pivots and drops the CSS-only hidden state of the lids', () => {
    const scene = parseKitStageScene(kitSvg())!
    const antenna = scene.nodes.find((n) => n.anim === 'antenna-left')!
    expect(antenna.pivot).not.toBeNull()
    const blink = scene.runs.find((r) => scene.nodes[r.node].anim === 'blink')!
    expect(blink.markup).toContain('<image')
    expect(scene.backdrop).toContain('lobster-background-layer')
  })

  it('marks worn gear so a new item can be celebrated', () => {
    const bare = wornHrefs(parseKitStageScene(kitSvg())!)
    const helmed = parseKitStageScene(kitSvg({ loadout: 'head=helm.rare' }))!
    const added = [...wornHrefs(helmed)].filter((h) => !bare.has(h))
    expect(added).toHaveLength(1)
    expect(added[0]).toContain('/gear/helm')
    expect(helmed.runs.some((r) => r.worn)).toBe(true)
  })

  it('rejects SVGs that are not painted-kit avatars', () => {
    expect(parseKitStageScene(buildAvatarSvg({ style: LOBSTER_AVATAR_STYLE, seed: 'x' }, 200, 'fullBody', 'vector'))).toBeNull()
  })
})

describe('kit stage motion', () => {
  it('rotates about the pivot, leaving it in place', () => {
    const m = poseMatrix({ rotate: 0.4, scaleX: 1.1, scaleY: 0.9, dx: 0, dy: 0, alpha: 1 }, [10, 20])
    const [x, y] = apply(m, 10, 20)
    expect(x).toBeCloseTo(10)
    expect(y).toBeCloseTo(20)
    const [tx, ty] = apply(multiply(m, [1, 0, 0, 1, 0, 0]), 10, 20)
    expect(tx).toBeCloseTo(10)
    expect(ty).toBeCloseTo(20)
  })

  it('follows the CSS breath and blink timing', () => {
    expect(breath(0)).toBeCloseTo(0)
    expect(breath(2.2)).toBeCloseTo(1)
    expect(blinkAlpha(0)).toBe(0)
    expect(blinkAlpha(BLINK_SECONDS * 0.95)).toBe(1)
  })

  it('hops after a kick and settles again', () => {
    const motion = new StageMotion()
    motion.step(0, { x: 0, y: 0 })
    motion.kick()
    let peak = 0
    for (let t = 1; t <= 120; t++) {
      motion.step(t / 60, { x: 0, y: 0 })
      peak = Math.min(peak, motion.pose('root').dy)
    }
    expect(peak).toBeLessThan(-2)
    expect(Math.abs(motion.pose('root').dy)).toBeLessThan(0.05)
  })
})
