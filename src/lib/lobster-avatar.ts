/**
 * Member avatars: config parsing, seeded traits, and SVG generation for every race.
 *
 * Characters are drawn by the hand-built rigs in `./avatar/` (no third-party sprite):
 * - `avatar/traits.ts`   option catalogs and labels for the character creator
 * - `avatar/paint.ts`    shell gradients, finishes, markings, and the shared part painter
 * - `avatar/parts.ts`    eyes, mouths, claws, arms, antennae, accessories
 * - `avatar/races.ts`    lobster and crab body rigs
 * - `avatar/backdrop.ts` themes, animated patterns, textures, sparkles
 *
 * Saved configs only store what the member chose. Anything missing is rolled from the seed,
 * so configs saved before the creator existed keep rendering.
 */
import {
  LOBSTER_BACKGROUND_MOTION_MODES,
  LOBSTER_BACKGROUND_PATTERNS,
  LOBSTER_BACKGROUND_PATTERN_MAP,
  LOBSTER_BACKGROUND_TEXTURES,
  LOBSTER_BACKGROUND_TEXTURE_MAP,
  LOBSTER_BACKGROUND_THEMES,
  LOBSTER_BACKGROUND_THEME_MAP,
  LOBSTER_PATTERN_DENSITIES,
  LOBSTER_PATTERN_GLOWS,
  LOBSTER_PATTERN_PULSES,
  LOBSTER_PATTERN_SPARKLES,
  escapeSvgAttr,
  getPatternGlowFilterDef,
  renderLobsterSparkles,
  type BackgroundMotionConfig,
  type BackgroundMotionMode,
  type BackgroundPattern,
  type BackgroundTexture,
  type BackgroundTheme,
  type PatternDensity,
  type PatternGlow,
  type PatternPulse,
  type PatternSparkles,
} from './avatar/backdrop'
import { paintDefs, type PaintContext } from './avatar/paint'
import { AVATAR_EYE_COLORS, eyeDefs } from './avatar/parts'
import { portraitViewBox, renderCharacter, type CharacterSpec } from './avatar/races'
import {
  AVATAR_ACCESSORIES,
  AVATAR_ANTENNAE,
  AVATAR_BUILDS,
  AVATAR_HEAD_SHAPES,
  AVATAR_CLAWS,
  AVATAR_MOUTHS,
  AVATAR_POSES,
  AVATAR_RACES,
  SHELL_FINISHES,
  SHELL_MARKINGS,
  SHELL_PALETTES,
  SHELL_PALETTE_MAP,
  isOneOf,
  pickFrom,
  seededRandom,
  type AvatarAccessory,
  type AvatarAntennae,
  type AvatarBuild,
  type AvatarClaws,
  type AvatarHeadShape,
  type AvatarMouth,
  type AvatarPose,
  type AvatarRace,
  type ShellFinish,
  type ShellMarking,
} from './avatar/traits'

import { getAssetUrl } from './assets'
import { renderKitCharacter, type KitCharacterInput } from './avatar/kit/compose'
import { parseKitLoadout } from './avatar/kit/loadout'
import type { KitAsset, KitManifest } from './avatar/kit/manifest'

export * from './avatar/backdrop'
export * from './avatar/traits'

/** Stored style tag. Kept from the first avatar version so saved configs stay valid. */
export const LOBSTER_AVATAR_STYLE = 'critters' as const

export type EyelidStyle = 'open' | 'relaxed' | 'cheerful_squint' | 'focused' | 'chill' | 'angry' | 'worried'
export type LobsterEyeColor = (typeof AVATAR_EYE_COLORS)[number]

export const LOBSTER_EYELID_STYLES: readonly EyelidStyle[] = [
  'open',
  'relaxed',
  'cheerful_squint',
  'focused',
  'chill',
  'angry',
  'worried',
] as const

export const LOBSTER_EYE_COLORS: readonly LobsterEyeColor[] = AVATAR_EYE_COLORS

export const LOBSTER_EYE_COLOR_LABELS: Readonly<Record<LobsterEyeColor, string>> = {
  amber: 'Amber',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
  amethyst: 'Amethyst',
  ruby: 'Ruby',
  topaz: 'Topaz',
}

export const LOBSTER_EYE_VARIANTS = ['round', 'wide', 'tall'] as const
export type LobsterEyeVariant = (typeof LOBSTER_EYE_VARIANTS)[number]

export const LOBSTER_EYE_VARIANT_LABELS: Readonly<Record<LobsterEyeVariant, string>> = {
  round: 'Round',
  wide: 'Wide',
  tall: 'Tall',
}

export const LOBSTER_PUPIL_VARIANTS = ['standard', 'big', 'sparkle', 'keen'] as const
export type LobsterPupilVariant = (typeof LOBSTER_PUPIL_VARIANTS)[number]

export const LOBSTER_PUPIL_VARIANT_LABELS: Readonly<Record<LobsterPupilVariant, string>> = {
  standard: 'Classic',
  big: 'Big and soft',
  sparkle: 'Starry',
  keen: 'Sharp',
}

export type LobsterHeight = 'short' | 'regular' | 'tall' | 'towering'

export const LOBSTER_HEIGHTS: readonly LobsterHeight[] = ['short', 'regular', 'tall', 'towering'] as const

export const LOBSTER_HEIGHT_MAP: Readonly<Record<string, LobsterHeight>> = {
  short: 'short',
  compact: 'short',
  regular: 'regular',
  medium: 'regular',
  standard: 'regular',
  tall: 'tall',
  towering: 'towering',
  giant: 'towering',
  colossal: 'towering',
}

export const LOBSTER_HEIGHT_LABELS: Readonly<Record<LobsterHeight, string>> = {
  short: 'Short',
  regular: 'Regular',
  tall: 'Tall',
  towering: 'Towering',
}

export const LOBSTER_HEIGHT_SCALES: Readonly<Record<LobsterHeight, number>> = {
  short: 0.88,
  regular: 1.0,
  tall: 1.14,
  towering: 1.25,
}

export function resolveHeightScale(height?: LobsterHeight | string | number): number {
  if (typeof height === 'number' && Number.isFinite(height)) {
    const normalized = height > 2 ? height / 100 : height
    return Math.min(1.4, Math.max(0.75, normalized))
  }
  if (typeof height === 'string') {
    const mapped = LOBSTER_HEIGHT_MAP[height.toLowerCase().trim()]
    if (mapped) return LOBSTER_HEIGHT_SCALES[mapped]
  }
  return 1.0
}

export interface LobsterAvatarConfig {
  style: typeof LOBSTER_AVATAR_STYLE
  seed: string
  race?: AvatarRace
  shellColor?: string
  shellFinish?: ShellFinish
  marking?: ShellMarking
  mouth?: AvatarMouth
  antennae?: AvatarAntennae
  claws?: AvatarClaws
  pose?: AvatarPose
  accessory?: AvatarAccessory
  headShape?: AvatarHeadShape
  build?: AvatarBuild
  height?: LobsterHeight | number
  armScale?: number
  backgroundTheme?: string
  backgroundPattern?: string
  backgroundTexture?: string
  patternDensity?: PatternDensity
  patternGlow?: PatternGlow
  patternPulse?: PatternPulse
  patternSparkles?: PatternSparkles
  eyelidStyle?: EyelidStyle
  eyeColor?: LobsterEyeColor
  eyeVariant?: LobsterEyeVariant
  pupilVariant?: LobsterPupilVariant
  backgroundMotion?: BackgroundMotionMode
  transparentBackground?: boolean
  /** Worn gear and looks, written by the server (see avatar/kit/loadout.ts). */
  loadout?: string
  /** Pre-rendered static portrait in the bucket, written by the server on save. */
  portraitKey?: string
  /**
   * Draw with painted kit art. Written by the server only for members in the `avatar-kit`
   * experiment; without it the avatar stays on the vector rig and loadout/portrait are ignored.
   */
  kit?: boolean
}

/** Every look trait, fully resolved from a config plus its seed. */
export interface ResolvedAvatarTraits {
  race: AvatarRace
  shellColor: string
  shellFinish: ShellFinish
  marking: ShellMarking
  mouth: AvatarMouth
  antennae: AvatarAntennae
  claws: AvatarClaws
  pose: AvatarPose
  accessory: AvatarAccessory
  headShape: AvatarHeadShape
  build: AvatarBuild
  height: LobsterHeight | number
  eyelidStyle: EyelidStyle
  eyeColor: LobsterEyeColor
  eyeVariant: LobsterEyeVariant
  pupilVariant: LobsterPupilVariant
  backgroundTheme: string
  backgroundPattern: string
  backgroundTexture: string
}

/** Config keys the character creator writes. */
export const AVATAR_TRAIT_KEYS = [
  'race',
  'shellColor',
  'shellFinish',
  'marking',
  'mouth',
  'antennae',
  'claws',
  'pose',
  'accessory',
  'headShape',
  'build',
  'height',
  'eyelidStyle',
  'eyeColor',
  'eyeVariant',
  'pupilVariant',
  'backgroundTheme',
  'backgroundPattern',
  'backgroundTexture',
] as const satisfies readonly (keyof ResolvedAvatarTraits)[]

export function isValidLobsterAvatarStyle(styleId: string): boolean {
  return styleId === LOBSTER_AVATAR_STYLE
}

const lower = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : v)

export function parseLobsterAvatarConfig(raw: unknown): LobsterAvatarConfig | null {
  if (!raw) return null
  let candidate = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      candidate = JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  if (!candidate || typeof candidate !== 'object') return null
  const obj = candidate as Record<string, unknown>
  if (typeof obj.seed !== 'string') return null
  const seed = obj.seed.trim()
  if (!seed || seed.length > 128) return null

  const config: LobsterAvatarConfig = { style: LOBSTER_AVATAR_STYLE, seed }
  if (isOneOf(AVATAR_RACES, lower(obj.race))) config.race = lower(obj.race) as AvatarRace
  if (typeof obj.shellColor === 'string' && SHELL_PALETTE_MAP[obj.shellColor.trim()]) config.shellColor = obj.shellColor.trim()
  if (isOneOf(SHELL_FINISHES, lower(obj.shellFinish))) config.shellFinish = lower(obj.shellFinish) as ShellFinish
  if (isOneOf(SHELL_MARKINGS, lower(obj.marking))) config.marking = lower(obj.marking) as ShellMarking
  if (isOneOf(AVATAR_MOUTHS, lower(obj.mouth))) config.mouth = lower(obj.mouth) as AvatarMouth
  if (isOneOf(AVATAR_ANTENNAE, lower(obj.antennae))) config.antennae = lower(obj.antennae) as AvatarAntennae
  if (isOneOf(AVATAR_CLAWS, lower(obj.claws))) config.claws = lower(obj.claws) as AvatarClaws
  if (isOneOf(AVATAR_POSES, lower(obj.pose))) config.pose = lower(obj.pose) as AvatarPose
  if (isOneOf(AVATAR_ACCESSORIES, lower(obj.accessory))) config.accessory = lower(obj.accessory) as AvatarAccessory
  if (isOneOf(AVATAR_HEAD_SHAPES, lower(obj.headShape))) config.headShape = lower(obj.headShape) as AvatarHeadShape
  if (isOneOf(AVATAR_BUILDS, lower(obj.build))) config.build = lower(obj.build) as AvatarBuild
  if (typeof obj.height === 'string') {
    const norm = obj.height.toLowerCase().trim()
    if (norm in LOBSTER_HEIGHT_MAP) config.height = LOBSTER_HEIGHT_MAP[norm]
  } else if (typeof obj.height === 'number' && Number.isFinite(obj.height)) {
    config.height = obj.height
  }
  if (typeof obj.armScale === 'number' && Number.isFinite(obj.armScale)) {
    config.armScale = Math.min(1.4, Math.max(0.7, Number(obj.armScale.toFixed(2))))
  }
  if (typeof obj.backgroundTheme === 'string' && obj.backgroundTheme.trim()) config.backgroundTheme = obj.backgroundTheme.trim()
  if (typeof obj.backgroundPattern === 'string' && obj.backgroundPattern.trim()) config.backgroundPattern = obj.backgroundPattern.trim()
  if (typeof obj.backgroundTexture === 'string' && obj.backgroundTexture.trim()) config.backgroundTexture = obj.backgroundTexture.trim()
  if (isOneOf(LOBSTER_PATTERN_DENSITIES, obj.patternDensity)) config.patternDensity = obj.patternDensity
  if (isOneOf(LOBSTER_PATTERN_GLOWS, obj.patternGlow)) config.patternGlow = obj.patternGlow
  if (isOneOf(LOBSTER_PATTERN_PULSES, obj.patternPulse)) config.patternPulse = obj.patternPulse
  if (isOneOf(LOBSTER_PATTERN_SPARKLES, obj.patternSparkles)) config.patternSparkles = obj.patternSparkles
  if (isOneOf(LOBSTER_EYELID_STYLES, obj.eyelidStyle)) config.eyelidStyle = obj.eyelidStyle
  if (isOneOf(LOBSTER_EYE_COLORS, lower(obj.eyeColor))) config.eyeColor = lower(obj.eyeColor) as LobsterEyeColor
  if (isOneOf(LOBSTER_EYE_VARIANTS, lower(obj.eyeVariant))) config.eyeVariant = lower(obj.eyeVariant) as LobsterEyeVariant
  if (isOneOf(LOBSTER_PUPIL_VARIANTS, lower(obj.pupilVariant))) config.pupilVariant = lower(obj.pupilVariant) as LobsterPupilVariant
  if (typeof obj.backgroundMotion === 'string' && isOneOf(LOBSTER_BACKGROUND_MOTION_MODES, obj.backgroundMotion.trim())) {
    config.backgroundMotion = obj.backgroundMotion.trim() as BackgroundMotionMode
  }
  if (typeof obj.transparentBackground === 'boolean') config.transparentBackground = obj.transparentBackground
  if (typeof obj.loadout === 'string' && obj.loadout.length <= 600) config.loadout = obj.loadout
  if (typeof obj.portraitKey === 'string' && isAvatarPortraitKey(obj.portraitKey)) config.portraitKey = obj.portraitKey
  if (obj.kit === true) config.kit = true
  return config
}

export function randomLobsterSeed(): string {
  const bytes = new Uint32Array(2)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
    return `larva-${bytes[0].toString(36)}-${bytes[1].toString(36)}`
  }
  return `larva-${Math.random().toString(36).slice(2, 10)}`
}

export interface SeededAvatarOptions {
  theme: BackgroundTheme
  pattern: BackgroundPattern
  texture: BackgroundTexture
  density: PatternDensity
  glow: PatternGlow
  pulse: PatternPulse
  sparkles: PatternSparkles
  eyelidStyle: EyelidStyle
  eyeColor: LobsterEyeColor
  eyeVariant: LobsterEyeVariant
  pupilVariant: LobsterPupilVariant
  height: LobsterHeight
  motion: BackgroundMotionConfig
  pose: AvatarPose
  antennae: AvatarAntennae
  shellColor: string
  /** Shell for configs saved before races existed: the original red and orange family. */
  legacyShellColor: string
  shellFinish: ShellFinish
  marking: ShellMarking
  mouth: AvatarMouth
  claws: AvatarClaws
  accessory: AvatarAccessory
}

const LEGACY_POSES: readonly AvatarPose[] = ['cheer', 'wave', 'wave', 'rest']
const LEGACY_ANTENNAE: readonly AvatarAntennae[] = ['whip', 'bolt', 'curl', 'beacon', 'plume']
const LEGACY_SHELL_COLORS: readonly string[] = ['coral', 'crimson', 'tangerine']

/**
 * Deterministic traits for a seed. Backdrop, eyes, height, pose, and antennae use the same
 * hashes as the first avatar version, so members keep those picks after the redraw.
 */
export function getLobsterAvatarSeededOptions(seed: string): SeededAvatarOptions {
  let hash1 = 0
  let hash2 = 0
  let hash3 = 0
  let hash4 = 0
  let hash5 = 0
  let hash6 = 0
  let hash7 = 0
  let hash8 = 0
  let hash9 = 0
  let hash10 = 0
  let hash11 = 0
  let hash12 = 0
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i)
    hash1 = (((hash1 << 5) - hash1) + ch) | 0
    hash2 = ((hash2 * 37) + ch + 11) | 0
    hash3 = (((hash3 << 7) - hash3) + ch * 17 + 19) | 0
    hash4 = (((hash4 << 9) + hash4) + ch * 31 + 23) | 0
    hash5 = (((hash5 << 6) - hash5) + ch * 43 + 29) | 0
    hash6 = (((hash6 << 8) + hash6) + ch * 53 + 37) | 0
    hash7 = (((hash7 << 7) + hash7) + ch * 61 + 41) | 0
    hash8 = (((hash8 << 8) - hash8) + ch * 71 + 47) | 0
    hash9 = (((hash9 << 5) + hash9) + ch * 79 + 53) | 0
    hash10 = (((hash10 << 6) - hash10) + ch * 83 + 59) | 0
    hash11 = (((hash11 << 7) - hash11) + ch * 89 + 67) | 0
    hash12 = (((hash12 << 5) - hash12) + ch * 97 + 71) | 0
  }

  const pattern = LOBSTER_BACKGROUND_PATTERNS[Math.abs(hash4) % LOBSTER_BACKGROUND_PATTERNS.length]
  const patternMotionModes: Record<string, BackgroundMotionMode[]> = {
    isometric_cubes: ['drift_diagonal', 'drift_horizontal'],
    benthic_bubbles: ['wave_undulate', 'drift_diagonal'],
    circuit_board: ['drift_diagonal', 'drift_horizontal'],
    cyber_hex_mesh: ['drift_diagonal', 'drift_horizontal'],
    overlapping_circles: ['radar_sweep', 'drift_diagonal', 'drift_horizontal'],
    triangle_constellations: ['wave_undulate', 'radar_sweep'],
    dense_lattice: ['drift_diagonal', 'drift_horizontal'],
  }
  const compatibleModes = patternMotionModes[pattern.id] ?? ['drift_diagonal', 'drift_horizontal']
  const durations = [10, 12, 14, 16]

  const rng = seededRandom(seed)
  const accessoryRoll = rng()

  return {
    theme: LOBSTER_BACKGROUND_THEMES[Math.abs(hash3) % LOBSTER_BACKGROUND_THEMES.length],
    pattern,
    texture: LOBSTER_BACKGROUND_TEXTURES[Math.abs(hash6) % LOBSTER_BACKGROUND_TEXTURES.length],
    density: LOBSTER_PATTERN_DENSITIES[Math.abs(hash7) % LOBSTER_PATTERN_DENSITIES.length],
    glow: LOBSTER_PATTERN_GLOWS[Math.abs(hash8) % LOBSTER_PATTERN_GLOWS.length],
    pulse: LOBSTER_PATTERN_PULSES[Math.abs(hash9) % LOBSTER_PATTERN_PULSES.length],
    sparkles: LOBSTER_PATTERN_SPARKLES[Math.abs(hash10) % LOBSTER_PATTERN_SPARKLES.length],
    eyelidStyle: LOBSTER_EYELID_STYLES[Math.abs(hash7 ^ hash8) % LOBSTER_EYELID_STYLES.length],
    eyeColor: LOBSTER_EYE_COLORS[Math.abs(hash12) % LOBSTER_EYE_COLORS.length],
    eyeVariant: LOBSTER_EYE_VARIANTS[Math.abs(hash3 ^ hash11) % LOBSTER_EYE_VARIANTS.length],
    pupilVariant: LOBSTER_PUPIL_VARIANTS[Math.abs(hash4 ^ hash12) % LOBSTER_PUPIL_VARIANTS.length],
    height: LOBSTER_HEIGHTS[Math.abs(hash11) % LOBSTER_HEIGHTS.length],
    motion: {
      mode: compatibleModes[Math.abs(hash5) % compatibleModes.length],
      duration: durations[Math.abs(hash5 >> 3) % durations.length],
      direction: (hash5 & 1) === 0 ? 'normal' : 'reverse',
    },
    pose: LEGACY_POSES[Math.abs(hash1) % LEGACY_POSES.length],
    antennae: LEGACY_ANTENNAE[Math.abs(hash2) % LEGACY_ANTENNAE.length],
    shellColor: pickFrom(rng, SHELL_PALETTES).id,
    legacyShellColor: pickFrom(seededRandom(`${seed}:legacy-shell`), LEGACY_SHELL_COLORS),
    shellFinish: pickFrom(rng, SHELL_FINISHES),
    marking: rng() < 0.3 ? 'none' : pickFrom(rng, SHELL_MARKINGS),
    mouth: pickFrom(rng, AVATAR_MOUTHS),
    claws: pickFrom(rng, AVATAR_CLAWS),
    accessory: accessoryRoll < 0.45 ? 'none' : pickFrom(rng, AVATAR_ACCESSORIES),
  }
}

/** Resolve every look trait: explicit config values win, the seed fills the rest. */
export function resolveAvatarTraits(config: LobsterAvatarConfig): ResolvedAvatarTraits {
  const seeded = getLobsterAvatarSeededOptions(config.seed)
  return {
    race: isOneOf(AVATAR_RACES, config.race) ? config.race : 'lobster',
    // Configs saved before races existed keep a red or orange shell, like the original lobsters.
    shellColor:
      config.shellColor && SHELL_PALETTE_MAP[config.shellColor]
        ? config.shellColor
        : config.race
          ? seeded.shellColor
          : seeded.legacyShellColor,
    shellFinish: isOneOf(SHELL_FINISHES, config.shellFinish) ? config.shellFinish : seeded.shellFinish,
    marking: isOneOf(SHELL_MARKINGS, config.marking) ? config.marking : seeded.marking,
    mouth: isOneOf(AVATAR_MOUTHS, config.mouth) ? config.mouth : seeded.mouth,
    antennae: isOneOf(AVATAR_ANTENNAE, config.antennae) ? config.antennae : seeded.antennae,
    claws: isOneOf(AVATAR_CLAWS, config.claws) ? config.claws : seeded.claws,
    pose: isOneOf(AVATAR_POSES, config.pose) ? config.pose : seeded.pose,
    accessory: isOneOf(AVATAR_ACCESSORIES, config.accessory) ? config.accessory : seeded.accessory,
    // Shapes arrived after members had saved looks, so an unset shape keeps the original body.
    headShape: isOneOf(AVATAR_HEAD_SHAPES, config.headShape) ? config.headShape : 'bean',
    build: isOneOf(AVATAR_BUILDS, config.build) ? config.build : 'classic',
    height: config.height ?? seeded.height,
    eyelidStyle: config.eyelidStyle && isOneOf(LOBSTER_EYELID_STYLES, config.eyelidStyle) ? config.eyelidStyle : seeded.eyelidStyle,
    eyeColor: isOneOf(LOBSTER_EYE_COLORS, lower(config.eyeColor)) ? (lower(config.eyeColor) as LobsterEyeColor) : seeded.eyeColor,
    eyeVariant: isOneOf(LOBSTER_EYE_VARIANTS, lower(config.eyeVariant)) ? (lower(config.eyeVariant) as LobsterEyeVariant) : seeded.eyeVariant,
    pupilVariant: isOneOf(LOBSTER_PUPIL_VARIANTS, lower(config.pupilVariant)) ? (lower(config.pupilVariant) as LobsterPupilVariant) : seeded.pupilVariant,
    backgroundTheme: (config.backgroundTheme && LOBSTER_BACKGROUND_THEME_MAP[config.backgroundTheme]?.id) || seeded.theme.id,
    backgroundPattern: (config.backgroundPattern && LOBSTER_BACKGROUND_PATTERN_MAP[config.backgroundPattern]?.id) || seeded.pattern.id,
    backgroundTexture: (config.backgroundTexture && LOBSTER_BACKGROUND_TEXTURE_MAP[config.backgroundTexture]?.id) || seeded.texture.id,
  }
}

/** Full-body square frame. The character stands on y=185 around the x=50 centre line. */
export const LOBSTER_FULL_BODY_VIEWBOX = '-65 -35 230 230' as const
/** Head-and-shoulders close-up used by every static portrait. */
export const LOBSTER_PORTRAIT_VIEWBOX = '-9 -11 118 118' as const

/** Portrait framing per race, so every face sits in the same spot of the porthole. */
export const AVATAR_PORTRAIT_VIEWBOXES: Readonly<Record<AvatarRace, string>> = {
  lobster: LOBSTER_PORTRAIT_VIEWBOX,
  crab: '-9 19 118 118',
}

export type LobsterAvatarFrame = 'portrait' | 'fullBody'

export interface GenerateLobsterAvatarOptions {
  frame?: LobsterAvatarFrame
  /** Strip SMIL motion tags. Implied for the portrait frame. */
  staticMotion?: boolean
  /**
   * Draw the painted kit when this race has art. Kit SVGs reference bucket images, so they
   * only render inline (never as an `<img>` src); `LobsterAvatarDisplay` handles that.
   */
  kit?: boolean
}

/** Bucket keys of server-rendered static portraits. */
const PORTRAIT_KEY_PATTERN = /^images\/avatar-portraits\/[a-f0-9]{16,64}\.webp$/

export function isAvatarPortraitKey(value: string): boolean {
  return PORTRAIT_KEY_PATTERN.test(value)
}

/** Kit SVGs open with this attribute so the display can spot them without decoding. */
export const KIT_SVG_DATA_URI_PREFIX = `data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg data-kit="1"')}`

export function isKitSvgDataUri(src: string): boolean {
  return src.startsWith(KIT_SVG_DATA_URI_PREFIX)
}

/** Kit inputs (variants, colours, loadout) for a config, already resolved from its seed. */
export function resolveKitCharacterInput(config: LobsterAvatarConfig): KitCharacterInput {
  const traits = resolveAvatarTraits(config)
  return {
    race: traits.race,
    palette: SHELL_PALETTE_MAP[traits.shellColor] ?? SHELL_PALETTES[0],
    finish: traits.shellFinish,
    eyeColor: traits.eyeColor,
    heightScale: resolveHeightScale(traits.height),
    variants: {
      antennae: traits.antennae,
      claws: traits.claws,
      build: traits.build,
      headShape: traits.headShape,
      eyeVariant: traits.eyeVariant,
      mouth: traits.mouth,
      accessory: traits.accessory,
    },
    loadout: parseKitLoadout(config.loadout),
  }
}

export interface BuildAvatarSvgOptions {
  /** Use kit art when the race has it. */
  kit?: boolean
  /** Override how kit images are referenced (the server embeds them as data URIs). */
  kitHref?: (asset: KitAsset) => string
  /** Kit art to draw from (defaults to the committed manifest; the art scripts pass local files). */
  kitManifest?: KitManifest
}

/** Remove SMIL animate nodes so a portrait data URI stays still even as an <img>. */
export function stripSvgSmilAnimation(svg: string): string {
  return svg
    .replace(/<animateTransform\b[^>]*\/>/gi, '')
    .replace(/<animate\b[^>]*\/>/gi, '')
    .replace(/<animateTransform\b[^>]*>[\s\S]*?<\/animateTransform>/gi, '')
    .replace(/<animate\b[^>]*>[\s\S]*?<\/animate>/gi, '')
}

function hashString(value: string): string {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(36)
}

function renderBackdrop(
  config: LobsterAvatarConfig,
  traits: ResolvedAvatarTraits,
  seeded: SeededAvatarOptions
): { defs: string; layer: string; theme: BackgroundTheme } {
  const theme = LOBSTER_BACKGROUND_THEME_MAP[traits.backgroundTheme] ?? seeded.theme
  const pattern = LOBSTER_BACKGROUND_PATTERN_MAP[traits.backgroundPattern] ?? seeded.pattern
  const texture = LOBSTER_BACKGROUND_TEXTURE_MAP[traits.backgroundTexture] ?? seeded.texture
  // Configs can arrive unparsed, so every value is checked against its catalog before it reaches markup.
  const density = isOneOf(LOBSTER_PATTERN_DENSITIES, config.patternDensity) ? config.patternDensity : seeded.density
  const glow = isOneOf(LOBSTER_PATTERN_GLOWS, config.patternGlow) ? config.patternGlow : seeded.glow
  const pulse = isOneOf(LOBSTER_PATTERN_PULSES, config.patternPulse) ? config.patternPulse : seeded.pulse
  const sparkles = isOneOf(LOBSTER_PATTERN_SPARKLES, config.patternSparkles) ? config.patternSparkles : seeded.sparkles
  const motion: BackgroundMotionConfig = isOneOf(LOBSTER_BACKGROUND_MOTION_MODES, config.backgroundMotion)
    ? { mode: config.backgroundMotion, duration: seeded.motion.duration, direction: seeded.motion.direction }
    : seeded.motion

  const bgGradId = `lobster-bg-grad-${theme.id}`
  const bgGlowId = `lobster-bg-glow-${theme.id}`
  const bgFloorGlowId = `lobster-bg-floor-${theme.id}`
  const angle = (((theme.gradientAngle ?? 135) - 90) * Math.PI) / 180
  const x1 = Math.round(50 - Math.cos(angle) * 50)
  const y1 = Math.round(50 - Math.sin(angle) * 50)
  const x2 = Math.round(50 + Math.cos(angle) * 50)
  const y2 = Math.round(50 + Math.sin(angle) * 50)

  const defs = `
      <linearGradient id="${bgGradId}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">
        <stop offset="0%" stop-color="${theme.topColor}" />
        <stop offset="45%" stop-color="${theme.primaryColor}" />
        <stop offset="100%" stop-color="${theme.bottomColor}" />
      </linearGradient>
      <radialGradient id="${bgGlowId}" cx="50%" cy="40%" r="62%">
        <stop offset="0%" stop-color="${theme.glowColor}" />
        <stop offset="55%" stop-color="${theme.glowColor}" stop-opacity="0.18" />
        <stop offset="100%" stop-color="${theme.glowColor}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="${bgFloorGlowId}" cx="50%" cy="92%" r="55%">
        <stop offset="0%" stop-color="${theme.glowSecondaryColor ?? theme.glowColor}" />
        <stop offset="60%" stop-color="${theme.glowSecondaryColor ?? theme.glowColor}" stop-opacity="0.12" />
        <stop offset="100%" stop-color="${theme.glowSecondaryColor ?? theme.glowColor}" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="lobster-bg-hush-${theme.id}" cx="50%" cy="52%" r="50%">
        <stop offset="0%" stop-color="${theme.bottomColor}" stop-opacity="0.82" />
        <stop offset="70%" stop-color="${theme.bottomColor}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${theme.bottomColor}" stop-opacity="0" />
      </radialGradient>
      ${getPatternGlowFilterDef(glow, theme)}`

  const textureLayer =
    texture.id !== 'none' && texture.publicUrl
      ? `<g id="lobster-texture-layer" data-texture="${texture.id}">
        <image href="${texture.publicUrl}" xlink:href="${texture.publicUrl}" x="-80" y="-50" width="260" height="260" preserveAspectRatio="xMidYMid slice" opacity="${texture.opacity ?? 0.38}" style="mix-blend-mode: overlay; pointer-events: none;" />
      </g>`
      : ''

  const layer = `
    <g id="lobster-background-layer" data-theme="${theme.id}" data-pattern="${pattern.id}" data-density="${density}" data-glow="${glow}" data-pulse="${pulse}" data-sparkles="${sparkles}" data-texture="${texture.id}" data-motion="${escapeSvgAttr(motion.mode)}">
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgGradId})" />
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgGlowId})" />
      <rect x="-80" y="-50" width="260" height="260" fill="url(#${bgFloorGlowId})" />
      ${textureLayer}
      ${pattern.render(theme, pattern.id, motion, density, glow, pulse)}
      <ellipse cx="50" cy="96" rx="78" ry="96" fill="url(#lobster-bg-hush-${theme.id})" />
      <g transform="translate(0 ${traits.race === 'crab' ? 26 : 0})">${renderLobsterSparkles(theme, sparkles, config.seed)}</g>
    </g>`

  return { defs, layer, theme }
}

export function buildAvatarSvg(
  config: LobsterAvatarConfig,
  size: number,
  frame: LobsterAvatarFrame,
  cacheKey: string,
  options: BuildAvatarSvgOptions = {}
): string {
  const traits = resolveAvatarTraits(config)
  const seeded = getLobsterAvatarSeededOptions(config.seed)
  const palette = SHELL_PALETTE_MAP[traits.shellColor] ?? SHELL_PALETTES[0]
  const isTransparent = Boolean(config.transparentBackground)
  const backdrop = isTransparent ? null : renderBackdrop(config, traits, seeded)

  const ctx: PaintContext = {
    uid: `av${hashString(cacheKey)}`,
    palette,
    partner: traits.marking === 'split' ? SHELL_PALETTE_MAP[palette.splitWith] ?? null : null,
    finish: traits.shellFinish,
    marking: traits.marking,
    rim: backdrop?.theme.accentColor ?? '#7dd3fc',
  }

  const spec: CharacterSpec = {
      race: traits.race,
      eyeColor: traits.eyeColor,
      eyeShape: traits.eyeVariant,
      pupil: traits.pupilVariant,
      expression: traits.eyelidStyle,
      mouth: traits.mouth,
      antennae: traits.antennae,
      claws: traits.claws,
      pose: traits.pose,
      accessory: traits.accessory,
      headShape: traits.headShape,
      build: traits.build,
      heightScale: resolveHeightScale(traits.height),
      armScale: typeof config.armScale === 'number' ? Math.min(1.3, Math.max(0.8, config.armScale)) : 1,
  }
  const kit = options.kit
    ? renderKitCharacter(resolveKitCharacterInput(config), {
        uid: ctx.uid,
        href: options.kitHref ?? ((asset) => getAssetUrl(asset.src)),
        manifest: options.kitManifest,
      })
    : null
  const character = kit ? kit.markup : renderCharacter(spec, ctx)

  const viewBox = frame === 'portrait' ? (kit ? kit.portraitViewBox : portraitViewBox(spec)) : LOBSTER_FULL_BODY_VIEWBOX
  const dataAttrs = [
    ...(kit ? ['data-kit="1"'] : []),
    `data-avatar-slot="${frame}"`,
    `data-race="${traits.race}"`,
    `data-shell="${escapeSvgAttr(palette.id)}"`,
    `data-finish="${traits.shellFinish}"`,
    `data-marking="${traits.marking}"`,
    `data-expression="${traits.eyelidStyle}"`,
    `data-eye-color="${traits.eyeColor}"`,
    `data-eye-variant="${traits.eyeVariant}"`,
    `data-pupil-variant="${traits.pupilVariant}"`,
    `data-accessory="${traits.accessory}"`,
    `data-head-shape="${traits.headShape}"`,
    `data-build="${traits.build}"`,
    `data-antennae="${traits.antennae}"`,
    `data-pose="${traits.pose}"`,
    `data-texture="${escapeSvgAttr(traits.backgroundTexture)}"`,
  ].join(' ')

  return `<svg ${dataAttrs} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}" width="${size}" height="${size}" role="img" aria-label="Member avatar">
  <defs>${backdrop?.defs ?? ''}${kit ? kit.defs : `${paintDefs(ctx)}${eyeDefs(ctx, traits.eyeColor)}`}</defs>
  ${backdrop?.layer ?? ''}
  ${character}
</svg>`
}

function getAvatarCacheKey(config: LobsterAvatarConfig, size: number, frame: LobsterAvatarFrame, staticMotion: boolean, kit = false): string {
  const ordered = Object.keys(config)
    .sort()
    .map((k) => `${k}=${String((config as unknown as Record<string, unknown>)[k])}`)
    .join('|')
  return `${ordered}|${size}|${frame}|${staticMotion ? 'static' : 'live'}${kit ? '|kit' : ''}`
}

const MAX_GENERATED_AVATAR_CACHE = 128
const generatedSvgCache = new Map<string, string>()
const generatedDataUriCache = new Map<string, string>()

function rememberLru(cache: Map<string, string>, key: string, value: string): void {
  if (cache.size >= MAX_GENERATED_AVATAR_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, value)
}

function readLru(cache: Map<string, string>, key: string): string | undefined {
  const hit = cache.get(key)
  if (hit !== undefined) {
    cache.delete(key)
    cache.set(key, hit)
  }
  return hit
}

export function clearGeneratedAvatarCache(): void {
  generatedSvgCache.clear()
  generatedDataUriCache.clear()
}

export function generateLobsterAvatarSvg(
  config: LobsterAvatarConfig,
  size = 256,
  options?: GenerateLobsterAvatarOptions
): string | null {
  if (!config?.seed) return null
  const frame = options?.frame ?? 'fullBody'
  const staticMotion = options?.staticMotion ?? frame === 'portrait'
  const kit = Boolean(options?.kit)
  const key = getAvatarCacheKey(config, size, frame, staticMotion, kit)
  const cached = readLru(generatedSvgCache, key)
  if (cached !== undefined) return cached

  let svg = buildAvatarSvg(config, size, frame, key, { kit })
  if (staticMotion) svg = stripSvgSmilAnimation(svg)
  rememberLru(generatedSvgCache, key, svg)
  return svg
}

export function generateLobsterAvatarDataUri(
  config: LobsterAvatarConfig,
  size = 256,
  options?: GenerateLobsterAvatarOptions
): string | null {
  if (!config?.seed) return null
  const frame = options?.frame ?? 'fullBody'
  const staticMotion = options?.staticMotion ?? frame === 'portrait'
  const kit = Boolean(options?.kit)
  const key = getAvatarCacheKey(config, size, frame, staticMotion, kit)
  const cached = readLru(generatedDataUriCache, key)
  if (cached !== undefined) return cached

  const svg = generateLobsterAvatarSvg(config, size, { frame, staticMotion, kit })
  if (!svg) return null
  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  rememberLru(generatedDataUriCache, key, dataUri)
  return dataUri
}

const profileAvatarCache = new Map<string, string | null>()

export function getCachedProfileAvatarUrl(userId: string): string | null | undefined {
  return profileAvatarCache.get(userId)
}

export function setCachedProfileAvatarUrl(userId: string, url: string | null): void {
  profileAvatarCache.set(userId, url)
}

export function clearCachedProfileAvatarUrl(userId: string): void {
  profileAvatarCache.delete(userId)
}

export interface GenerateLobsterAvatarSilhouetteOptions {
  frame?: LobsterAvatarFrame
  size?: number
}

/** Empty-state outline: the lobster rig's head, eyes, and antennae in one benthic tone. */
export const SILHOUETTE_PATHS = {
  head: 'M50,21 C71,21 85,36 86.5,60 C88,85 82,110 50,113 C18,110 12,85 13.5,60 C15,36 29,21 50,21 Z',
  antennaLeft: 'M45,24 C43,0 27,-22 1,-28',
  antennaRight: 'M55,24 C57,0 73,-22 99,-28',
  eyeLeft: { cx: 36.5, cy: 25, r: 14.5 },
  eyeRight: { cx: 63.5, cy: 25, r: 14.5 },
} as const

export function generateLobsterAvatarSilhouetteSvg(options?: GenerateLobsterAvatarSilhouetteOptions): string {
  const sizeAttr = options?.size ? ` width="${options.size}" height="${options.size}"` : ''
  const s = SILHOUETTE_PATHS
  return `<svg data-avatar-slot="portrait" data-avatar-silhouette="true" xmlns="http://www.w3.org/2000/svg" viewBox="${LOBSTER_PORTRAIT_VIEWBOX}" fill="none"${sizeAttr} role="img" aria-label="Avatar not set yet">
    <defs>
      <linearGradient id="sil-benthic-grad" x1="25%" y1="0%" x2="75%" y2="100%">
        <stop offset="0%" stop-color="#1d5267" />
        <stop offset="45%" stop-color="#0e2d3a" />
        <stop offset="100%" stop-color="#030e14" />
      </linearGradient>
    </defs>
    <g stroke="#00c3ff" stroke-linecap="round" stroke-opacity="0.75" stroke-width="2.6" fill="none">
      <path d="${s.antennaLeft}" /><path d="${s.antennaRight}" />
    </g>
    <g fill="url(#sil-benthic-grad)" stroke="#00c3ff" stroke-width="1.4" stroke-opacity="0.5">
      <path d="${s.head}" />
      <circle cx="${s.eyeLeft.cx}" cy="${s.eyeLeft.cy}" r="${s.eyeLeft.r}" />
      <circle cx="${s.eyeRight.cx}" cy="${s.eyeRight.cy}" r="${s.eyeRight.r}" />
    </g>
  </svg>`
}

export function generateLobsterAvatarSilhouetteDataUri(options?: GenerateLobsterAvatarSilhouetteOptions): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(generateLobsterAvatarSilhouetteSvg(options))}`
}


/**
 * Pin every look trait into the config before saving, so the avatar never shifts
 * if seeded defaults change later.
 */
export function lockAvatarConfig(config: LobsterAvatarConfig): LobsterAvatarConfig {
  return { ...config, ...resolveAvatarTraits(config), style: LOBSTER_AVATAR_STYLE }
}

/** A fresh random character that keeps the chosen race. */
export function rerollAvatarConfig(config: Pick<LobsterAvatarConfig, 'race'>): LobsterAvatarConfig {
  const seed = randomLobsterSeed()
  const rng = seededRandom(`${seed}:shape`)
  // New looks roll a shape too; unset shapes stay on the original body for saved members.
  return {
    style: LOBSTER_AVATAR_STYLE,
    seed,
    race: config.race ?? 'lobster',
    headShape: pickFrom(rng, AVATAR_HEAD_SHAPES),
    build: pickFrom(rng, AVATAR_BUILDS),
  }
}
