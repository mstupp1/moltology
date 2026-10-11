import { describe, expect, it } from 'vitest'
import { SHELL_PALETTE_MAP } from '../traits'
import { isKitRaceReady, kitTintRamp, pickKitAsset, renderKitCharacter, type KitCharacterInput } from './compose'
import { parseKitLoadout, serializeKitLoadout } from './loadout'
import type { KitManifest } from './manifest'
import { KIT_GROUND_Y, KIT_RACE_LAYERS, kitAssetKey } from './spec'

const box = (src: string, x = 100) => ({ src, x, y: 100, w: 200, h: 200 })

function manifestFor(keys: string[]): KitManifest {
  return { version: 1, races: {}, assets: Object.fromEntries(keys.map((k) => [k, box(`images/avatar-kit/${k}.webp`)])) }
}

const LOBSTER_REQUIRED = KIT_RACE_LAYERS.lobster
  .filter((l) => l.required)
  .map((l) => kitAssetKey('lobster', l.id, l.defaultVariant))

function input(overrides: Partial<KitCharacterInput> = {}): KitCharacterInput {
  return {
    race: 'lobster',
    palette: SHELL_PALETTE_MAP.coral,
    finish: 'glossy',
    eyeColor: 'amber',
    heightScale: 1,
    variants: {
      antennae: 'whip',
      claws: 'crusher',
      build: 'classic',
      headShape: 'bean',
      eyeVariant: 'round',
      mouth: 'grin',
      accessory: 'none',
    },
    loadout: { gear: {}, look: {} },
    ...overrides,
  }
}

const render = (manifest: KitManifest, overrides: Partial<KitCharacterInput> = {}) =>
  renderKitCharacter(input(overrides), { uid: 't', href: (a) => a.src, manifest })

describe('kit loadout string', () => {
  it('round-trips gear and looks', () => {
    const loadout = parseKitLoadout('head=helm.rare;claws-2=hammer.legendary;@claws=gilded-pincer')
    expect(loadout.gear.head).toEqual({ visual: 'helm', rarity: 'rare' })
    expect(loadout.gear['claws-2']).toEqual({ visual: 'hammer', rarity: 'legendary' })
    expect(loadout.look.claws).toBe('gilded-pincer')
    expect(parseKitLoadout(serializeKitLoadout(loadout))).toEqual(loadout)
  })

  it('drops unknown slots, visuals, rarities, and unsafe art keys', () => {
    const loadout = parseKitLoadout('tail=helm.rare;head=laser.rare;belt=belt.mythic;@head=<script>;@aura=x')
    expect(loadout).toEqual({ gear: {}, look: {} })
    expect(parseKitLoadout(undefined)).toEqual({ gear: {}, look: {} })
  })
})

describe('kit readiness and variant fallback', () => {
  it('needs every required layer before a race switches to kit art', () => {
    expect(isKitRaceReady('lobster', manifestFor(LOBSTER_REQUIRED))).toBe(true)
    expect(isKitRaceReady('lobster', manifestFor(LOBSTER_REQUIRED.slice(1)))).toBe(false)
    expect(isKitRaceReady('crab', manifestFor(LOBSTER_REQUIRED))).toBe(false)
    expect(render(manifestFor(LOBSTER_REQUIRED.slice(1)))).toBeNull()
  })

  it('falls back to the default variant when the requested one has no art', () => {
    const claw = KIT_RACE_LAYERS.lobster.find((l) => l.id === 'claw')!
    const manifest = manifestFor(LOBSTER_REQUIRED)
    expect(pickKitAsset('lobster', claw, 'crusher', manifest)?.src).toContain('claw/classic')
    const withCrusher = manifestFor([...LOBSTER_REQUIRED, 'lobster/claw/crusher'])
    expect(pickKitAsset('lobster', claw, 'crusher', withCrusher)?.src).toContain('claw/crusher')
  })
})

describe('renderKitCharacter', () => {
  const manifest = manifestFor([
    ...LOBSTER_REQUIRED,
    'lobster/gear/hammer',
    'lobster/gear/helm',
    'lobster/look/reef-crown',
    'lobster/look/gilded-pincer',
    'lobster/accessory/crown',
  ])

  it('mirrors paired parts and tints clay layers through a gradient map', () => {
    const out = render(manifest)!
    expect(out.markup).toContain('data-kit="1"')
    expect(out.markup.match(/lobster\/arm\/default/g)).toHaveLength(2)
    expect(out.markup).toContain('transform="matrix(-1 0 0 1 100 0)"')
    expect(out.defs).toContain('id="t-kit-shell"')
    expect(out.defs).toContain('feComponentTransfer')
    // Idle groups carry CSS pivots, never transform attributes of their own.
    expect(out.markup).toMatch(/lobster-idle-claw-left" style="transform-box:view-box;transform-origin:/)
  })

  it('renders optional eyebrows outside the blinking eyes group', () => {
    const out = render(manifestFor([...LOBSTER_REQUIRED, 'lobster/brows/round', 'lobster/lids/round']))!
    expect(out.markup).toMatch(/lobster-idle-eyes">.*lobster\/lids\/round.*?<\/g><\/g><image[^>]*lobster\/mouth\/grin[^>]*\/><image[^>]*lobster\/brows\/round/)
    expect(render(manifest)!.markup).not.toContain('lobster/brows/round')
  })

  it('keeps eyebrows visible above head gear, looks, and accessories', () => {
    const withBrows = manifestFor([...LOBSTER_REQUIRED, 'lobster/brows/round', 'lobster/gear/helm', 'lobster/look/reef-crown', 'lobster/accessory/crown'])
    for (const [loadout, top] of [['head=helm.common', 'gear/helm'], ['@head=reef-crown', 'look/reef-crown'], ['', 'accessory/crown']]) {
      const out = render(withBrows, { loadout: parseKitLoadout(loadout), variants: { ...input().variants, accessory: 'crown' } })!
      expect(out.markup.indexOf('lobster/brows/round')).toBeGreaterThan(out.markup.indexOf(`lobster/${top}`))
      expect(out.markup).toContain(`lobster/${top}`)
    }
  })

  it('swaps a claw for hammer gear on that side only, with a rarity glow', () => {
    const out = render(manifest, { loadout: parseKitLoadout('claws-2=hammer.legendary') })!
    expect(out.markup.match(/lobster\/claw\/classic/g)).toHaveLength(1)
    expect(out.markup).toContain('lobster/gear/hammer')
    expect(out.defs).toContain('t-kit-glow-legendary')
  })

  it('lets a look cover gear, and gear cover the creator accessory', () => {
    const helm = render(manifest, { loadout: parseKitLoadout('head=helm.common'), variants: { ...input().variants, accessory: 'crown' } })!
    expect(helm.markup).toContain('gear/helm')
    expect(helm.markup).not.toContain('accessory/crown')

    const look = render(manifest, { loadout: parseKitLoadout('head=helm.common;@head=reef-crown;@claws=gilded-pincer') })!
    expect(look.markup).toContain('look/reef-crown')
    expect(look.markup).not.toContain('gear/helm')
    expect(look.markup.match(/look\/gilded-pincer/g)).toHaveLength(2)
    expect(look.markup).not.toContain('claw/classic')
  })

  it('scales height about the ground line', () => {
    const tall = render(manifest, { heightScale: 1.25 })!
    const regular = render(manifest)!
    const y = (m: string) => Number(m.match(/lobster\/head\/bean[^>]*y="([-\d.]+)"/)![1])
    expect(y(tall.markup)).toBeLessThan(y(regular.markup))
    expect(KIT_GROUND_Y).toBeGreaterThan(900)
  })

  it('maps finishes and eye colours to different ramps', () => {
    const base = { palette: SHELL_PALETTE_MAP.cobalt, eyeColor: 'emerald' as const }
    expect(kitTintRamp('shell', { ...base, finish: 'glossy' })).not.toEqual(kitTintRamp('shell', { ...base, finish: 'chrome' }))
    expect(kitTintRamp('iris', { ...base, finish: 'glossy' })).toHaveLength(4)
  })
})
