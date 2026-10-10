/**
 * Builds the painted character as SVG markup from kit art.
 *
 * Output slots into the same `<svg>` the vector rig fills (backdrop, frame, data attributes),
 * and reuses the vector rig's idle classes, so `avatar-animations.css` animates both.
 * Geometry is written straight into the frame's viewBox units: groups carry only the CSS
 * idle classes, never a `transform` attribute, so the animation never fights a transform.
 */
import type { EquipmentRarity } from '../../../db/schema'
import type { AvatarRace, ShellFinish, ShellPalette } from '../traits'
import { GROUND_Y } from '../races'
import { EYE_COLOR_SWATCH, type AvatarEyeColor } from '../parts'
import { KIT_MANIFEST, type KitAsset, type KitManifest } from './manifest'
import {
  KIT_CENTER_X,
  KIT_DEFAULT_PIVOTS,
  KIT_GEAR_REPLACES,
  KIT_RACE_LAYERS,
  KIT_UNIT,
  KIT_VIEWBOX,
  canvasToViewBox,
  kitAssetKey,
  type KitLayerId,
  type KitLayerSpec,
  type KitTint,
} from './spec'
import type { KitLoadout } from './loadout'

/** Everything about the member the kit needs, already resolved from config + seed. */
export interface KitCharacterInput {
  race: AvatarRace
  palette: ShellPalette
  finish: ShellFinish
  eyeColor: AvatarEyeColor
  heightScale: number
  variants: {
    antennae: string
    claws: string
    build: string
    headShape: string
    eyeVariant: string
    mouth: string
    accessory: string
  }
  loadout: KitLoadout
}

export interface KitRenderOptions {
  /** Unique prefix for filter ids so several avatars can share a page. */
  uid: string
  /** Turns a bucket key into an image URL (client: `/media/...`; server: embedded data URI). */
  href: (asset: KitAsset) => string
  manifest?: KitManifest
}

export interface KitRender {
  defs: string
  markup: string
  /** Square crop around the face, in viewBox units. */
  portraitViewBox: string
}

const MIRROR_AXIS_VB = canvasToViewBox(KIT_CENTER_X, 'x')

function r2(n: number): number {
  return Math.round(n * 100) / 100
}

/** True when every required layer of the race has at least one drawing. */
export function isKitRaceReady(race: AvatarRace, manifest: KitManifest = KIT_MANIFEST): boolean {
  return KIT_RACE_LAYERS[race].every(
    (spec) => !spec.required || spec.variants.some((v) => manifest.assets[kitAssetKey(race, spec.id, v)])
  )
}

/** Requested variant, else the layer's default, else any drawn variant, else nothing. */
export function pickKitAsset(
  race: AvatarRace,
  spec: KitLayerSpec,
  requested: string | undefined,
  manifest: KitManifest = KIT_MANIFEST
): KitAsset | null {
  const tryKey = (v: string) => manifest.assets[kitAssetKey(race, spec.id, v)] ?? null
  if (requested) {
    const hit = tryKey(requested)
    if (hit) return hit
  }
  const fallback = tryKey(spec.defaultVariant)
  if (fallback) return fallback
  for (const v of spec.variants) {
    const hit = tryKey(v)
    if (hit) return hit
  }
  return null
}

// ─── Colour ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full.slice(0, 6), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function mix(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, '0')
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`
}

/** Dark-to-light colour ramp a grey clay part is mapped onto. */
export function kitTintRamp(tint: Exclude<KitTint, null>, input: Pick<KitCharacterInput, 'palette' | 'finish' | 'eyeColor'>): string[] {
  const p = input.palette
  if (tint === 'iris') {
    const s = EYE_COLOR_SWATCH[input.eyeColor] ?? EYE_COLOR_SWATCH.amber
    return [s.ring, s.outer, s.mid, s.inner]
  }
  if (tint === 'belly') return [p.shade, p.bellyShade, p.belly, '#ffffff']
  switch (input.finish) {
    case 'satin':
      return [p.shade, mix(p.shade, p.base, 0.5), p.base, mix(p.base, p.highlight, 0.6)]
    case 'pearl':
      return [p.shade, p.base, mix(p.base, p.highlight, 0.7), '#fff6fb']
    case 'chrome':
      return [p.deep, p.highlight, p.shade, '#ffffff']
    default:
      return [p.deep, p.shade, p.base, p.highlight]
  }
}

function gradientMapFilter(id: string, ramp: string[]): string {
  const rgb = ramp.map(hexToRgb)
  const table = (i: 0 | 1 | 2) => rgb.map((c) => r2(c[i] / 255)).join(' ')
  return `<filter id="${id}" color-interpolation-filters="sRGB">` +
    '<feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0"/>' +
    `<feComponentTransfer><feFuncR type="table" tableValues="${table(0)}"/><feFuncG type="table" tableValues="${table(1)}"/><feFuncB type="table" tableValues="${table(2)}"/></feComponentTransfer>` +
    '</filter>'
}

function glowFilter(id: string, color: string, blur: number): string {
  return `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%">` +
    `<feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" result="b"/>` +
    `<feFlood flood-color="${color}" flood-opacity="0.85"/><feComposite in2="b" operator="in" result="g"/>` +
    '<feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
}

const RARITY_GLOW: Partial<Record<EquipmentRarity, string>> = {
  rare: '#3b82f6',
  epic: '#a855f7',
  legendary: '#f59e0b',
}

// ─── Geometry ────────────────────────────────────────────────────────────────

interface Placed {
  asset: KitAsset
  mirrored: boolean
  filter?: string
  extra?: string
}

function makeGeometry(heightScale: number) {
  const k = heightScale
  const sx = (px: number) => MIRROR_AXIS_VB + (canvasToViewBox(px, 'x') - MIRROR_AXIS_VB) * k
  const sy = (px: number) => GROUND_Y + (canvasToViewBox(px, 'y') - GROUND_Y) * k
  return {
    image(p: Placed, href: string): string {
      const attrs = [
        `href="${href}"`,
        `x="${r2(sx(p.asset.x))}"`,
        `y="${r2(sy(p.asset.y))}"`,
        `width="${r2(p.asset.w * KIT_UNIT * k)}"`,
        `height="${r2(p.asset.h * KIT_UNIT * k)}"`,
        'preserveAspectRatio="none"',
      ]
      if (p.mirrored) attrs.push(`transform="matrix(-1 0 0 1 ${r2(MIRROR_AXIS_VB * 2)} 0)"`)
      if (p.filter) attrs.push(`filter="url(#${p.filter})"`)
      return `<image ${attrs.join(' ')}${p.extra ?? ''}/>`
    },
    /** CSS pivot in viewBox units, optionally for the mirrored (screen-right) copy. */
    pivotStyle(point: readonly [number, number], mirrored = false): string {
      const x = sx(point[0])
      const vx = mirrored ? MIRROR_AXIS_VB * 2 - x : x
      return `style="transform-box:view-box;transform-origin:${r2(vx)}px ${r2(sy(point[1]))}px"`
    },
    toVbY: sy,
  }
}

// ─── Compose ─────────────────────────────────────────────────────────────────

export function renderKitCharacter(input: KitCharacterInput, options: KitRenderOptions): KitRender | null {
  const manifest = options.manifest ?? KIT_MANIFEST
  const { race, loadout } = input
  if (!isKitRaceReady(race, manifest)) return null

  const uid = options.uid
  const geo = makeGeometry(input.heightScale)
  const overrides = manifest.races[race] ?? {}
  const pivots = { ...KIT_DEFAULT_PIVOTS[race], ...(overrides.pivots ?? {}) }
  const specs = new Map<KitLayerId, KitLayerSpec>(KIT_RACE_LAYERS[race].map((s) => [s.id, s]))

  const defs: string[] = []
  const usedTints = new Set<Exclude<KitTint, null>>()
  const tintId = (tint: Exclude<KitTint, null>) => {
    usedTints.add(tint)
    return `${uid}-kit-${tint}`
  }
  const glowIds = new Map<string, string>()
  const glowId = (rarity: EquipmentRarity): string | undefined => {
    const color = RARITY_GLOW[rarity]
    if (!color) return undefined
    const id = `${uid}-kit-glow-${rarity}`
    if (!glowIds.has(id)) glowIds.set(id, glowFilter(id, color, 0.9))
    return id
  }

  const img = (p: Placed) => geo.image(p, options.href(p.asset))

  /** Base layer image (tinted per its spec), or '' when the race has no art for it. */
  const base = (id: KitLayerId, requested: string | undefined, mirrored = false, extra?: string): string => {
    const spec = specs.get(id)
    if (!spec) return ''
    const asset = pickKitAsset(race, spec, requested, manifest)
    if (!asset) return ''
    return img({ asset, mirrored, filter: spec.tint ? tintId(spec.tint) : undefined, extra })
  }
  const art = (group: string, variant: string, mirrored = false, filter?: string): string => {
    const asset = manifest.assets[kitAssetKey(race, group, variant)]
    return asset ? img({ asset, mirrored, filter }) : ''
  }
  const gearArt = (slot: keyof KitLoadout['gear'], mirrored = false): string => {
    const g = loadout.gear[slot]
    return g ? art('gear', g.visual, mirrored, glowId(g.rarity)) : ''
  }
  const gearReplaces = (slot: keyof KitLoadout['gear'], layerId: KitLayerId): boolean => {
    const g = loadout.gear[slot]
    return Boolean(g && KIT_GEAR_REPLACES[g.visual] === layerId && manifest.assets[kitAssetKey(race, 'gear', g.visual)])
  }
  const lookArt = (category: keyof KitLoadout['look'], mirrored = false): string => {
    const key = loadout.look[category]
    return key ? art('look', key, mirrored) : ''
  }

  const v = input.variants

  // Antennae: look > gear > base. One antennae slot drives both sides.
  const antenna = (mirrored: boolean): string => {
    const look = lookArt('antennae', mirrored)
    if (look) return look
    if (gearReplaces('antennae', 'antenna')) return gearArt('antennae', mirrored)
    return base('antenna', v.antennae, mirrored) + gearArt('antennae', mirrored)
  }

  // Claws: a claws look covers both sides; otherwise each side shows its own claw gear.
  const claw = (slot: 'claws-1' | 'claws-2', mirrored: boolean): string => {
    const look = lookArt('claws', mirrored)
    if (look) return look
    if (gearReplaces(slot, 'claw')) return gearArt(slot, mirrored)
    return base('claw', v.claws, mirrored) + gearArt(slot, mirrored)
  }

  // Head top: look > helm > creator accessory.
  const headTop = lookArt('head') || gearArt('head') || (v.accessory !== 'none' ? art('accessory', v.accessory) : '')

  const lidsAsset = specs.get('lids') ? pickKitAsset(race, specs.get('lids')!, v.eyeVariant, manifest) : null
  const lids = lidsAsset
    ? `<g class="lobster-idle-layer lobster-idle-blink" opacity="0">${img({ asset: lidsAsset, mirrored: false, filter: tintId('shell') })}</g>`
    : ''

  const legs = `<g class="lobster-idle-layer lobster-idle-flank-limbs">${base('legs', 'default')}${lookArt('legs') || gearArt('legs')}</g>`

  const tail = base('tail', 'default')
  const antennae =
    `<g class="lobster-idle-layer lobster-idle-antenna-left" ${geo.pivotStyle(pivots.antenna)}>${antenna(false)}</g>` +
    `<g class="lobster-idle-layer lobster-idle-antenna-right" ${geo.pivotStyle(pivots.antenna, true)}>${antenna(true)}</g>`

  const torso =
    base('body', race === 'crab' ? v.headShape : v.build) +
    `<g class="lobster-idle-layer lobster-idle-abdomen">${base('belly', v.build)}</g>` +
    (lookArt('carapace') || gearArt('carapace')) +
    (lookArt('belt') || gearArt('belt'))

  const face =
    base('head', v.headShape) +
    `<g class="lobster-idle-layer lobster-idle-eyes">${base('eyes', v.eyeVariant)}${base('iris', v.eyeVariant)}${lids}</g>` +
    base('mouth', v.mouth) +
    headTop

  const arms =
    `<g class="lobster-idle-layer lobster-idle-claw-left" ${geo.pivotStyle(pivots.shoulder)}>${base('arm', 'default')}${claw('claws-1', false)}</g>` +
    `<g class="lobster-idle-layer lobster-idle-claw-right" ${geo.pivotStyle(pivots.shoulder, true)}>${base('arm', 'default', true)}${claw('claws-2', true)}</g>`

  const tailGroup = tail ? `<g class="lobster-idle-layer lobster-idle-tail" ${geo.pivotStyle(pivots.tail)}>${tail}</g>` : ''

  const glowFinish = input.finish === 'glow'
  if (glowFinish) defs.push(glowFilter(`${uid}-kit-finish`, input.palette.highlight, 1.6))

  for (const tint of usedTints) defs.push(gradientMapFilter(`${uid}-kit-${tint}`, kitTintRamp(tint, input)))
  defs.push(...glowIds.values())

  const upper = `<g class="lobster-idle-layer lobster-idle-carapace">${antennae}${tailGroup}${torso}${face}${arms}</g>`
  const markup = `<g class="avatar-character" data-race="${race}" data-kit="1"${glowFinish ? ` filter="url(#${uid}-kit-finish)"` : ''}>${legs}${upper}</g>`

  return { defs: defs.join(''), markup, portraitViewBox: kitPortraitViewBox(input, manifest, geo.toVbY) }
}

/** Same framing rule as the vector rig: a 118-unit square that follows the eyes. */
function kitPortraitViewBox(input: KitCharacterInput, manifest: KitManifest, toVbY: (px: number) => number): string {
  const spec = KIT_RACE_LAYERS[input.race].find((s) => s.id === 'eyes')
  const eyes = spec ? pickKitAsset(input.race, spec, input.variants.eyeVariant, manifest) : null
  const offset = manifest.races[input.race]?.portraitOffsetY ?? 0
  const eyeCenterPx = eyes ? eyes.y + eyes.h / 2 : KIT_VIEWBOX.size / 2 / KIT_UNIT
  const eyeY = toVbY(eyeCenterPx + offset)
  const lead = input.race === 'crab' ? 36 : 35
  return `-9 ${r2(eyeY - lead)} 118 118`
}
