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
import type { EquippedAppearance } from './character-appearance'
import { getEquipmentVisual } from './avatar/equipment'
import { EQUIP_SLOT_IDS, EQUIPMENT_RARITIES, equipSlotCategory } from './chassis-loadout'
import { AVATAR_EYE_COLORS } from './avatar/parts'
import {
  AVATAR_ACCESSORIES,
  AVATAR_ANTENNAE,
  AVATAR_BUILDS,
  AVATAR_HEAD_SHAPES,
  AVATAR_CLAWS,
  AVATAR_MOUTHS,
  SEEDED_MOUTHS,
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

export * from './avatar/backdrop'
export * from './avatar/traits'

/** Stored style tag. Kept from the first avatar version so saved configs stay valid. */
export const LOBSTER_AVATAR_STYLE = 'critters' as const

export type EyelidStyle = 'open' | 'relaxed' | 'cheerful_squint' | 'focused' | 'chill' | 'angry' | 'worried' | 'sad' | 'smug' | 'shocked' | 'wink'
export type LobsterEyeColor = (typeof AVATAR_EYE_COLORS)[number]

export const LOBSTER_EYELID_STYLES: readonly EyelidStyle[] = [
  'open',
  'relaxed',
  'cheerful_squint',
  'focused',
  'chill',
  'angry',
  'worried',
  'sad',
  'smug',
  'shocked',
  'wink',
] as const

/** Seeded characters roll from the original seven, so new expressions never change an existing member's look. */
const SEEDED_EYELID_STYLES = LOBSTER_EYELID_STYLES.slice(0, 7)

export const LOBSTER_EYE_COLORS: readonly LobsterEyeColor[] = AVATAR_EYE_COLORS

export const LOBSTER_EYE_COLOR_LABELS: Readonly<Record<LobsterEyeColor, string>> = {
  amber: 'Amber',
  sapphire: 'Sapphire',
  emerald: 'Emerald',
  amethyst: 'Amethyst',
  ruby: 'Ruby',
  topaz: 'Topaz',
}

/** Where the pupils point. Unset keeps the original slight inward look. */
export const LOBSTER_GAZES = ['ahead', 'left', 'right', 'up', 'down'] as const
export type LobsterGaze = (typeof LOBSTER_GAZES)[number]
export const LOBSTER_GAZE_LABELS: Readonly<Record<LobsterGaze, string>> = {
  ahead: 'Ahead',
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down',
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
  /** Read-only snapshot derived from owned equipment by the server. */
  equipment?: EquippedAppearance
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
  gaze?: LobsterGaze
  backgroundMotion?: BackgroundMotionMode
  transparentBackground?: boolean
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
  gaze: LobsterGaze
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
  'gaze',
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
  if (isOneOf(LOBSTER_GAZES, lower(obj.gaze))) config.gaze = lower(obj.gaze) as LobsterGaze
  if (typeof obj.backgroundMotion === 'string' && isOneOf(LOBSTER_BACKGROUND_MOTION_MODES, obj.backgroundMotion.trim())) {
    config.backgroundMotion = obj.backgroundMotion.trim() as BackgroundMotionMode
  }
  if (typeof obj.transparentBackground === 'boolean') config.transparentBackground = obj.transparentBackground
  if (obj.equipment && typeof obj.equipment === 'object') {
    config.equipment = {}
    for (const slot of EQUIP_SLOT_IDS) {
      const value = (obj.equipment as Record<string, unknown>)[slot] as { visualKey?: unknown; rarity?: unknown } | undefined
      const visual = typeof value?.visualKey === 'string' ? getEquipmentVisual(value.visualKey) : null
      if (visual && visual.category === equipSlotCategory(slot) && isOneOf(EQUIPMENT_RARITIES, value?.rarity)) {
        config.equipment[slot] = { visualKey: visual.key, rarity: value.rarity }
      }
    }
  }
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
    eyelidStyle: SEEDED_EYELID_STYLES[Math.abs(hash7 ^ hash8) % SEEDED_EYELID_STYLES.length],
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
    mouth: pickFrom(rng, SEEDED_MOUTHS),
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
    gaze: isOneOf(LOBSTER_GAZES, lower(config.gaze)) ? (lower(config.gaze) as LobsterGaze) : 'ahead',
    backgroundTheme: (config.backgroundTheme && LOBSTER_BACKGROUND_THEME_MAP[config.backgroundTheme]?.id) || seeded.theme.id,
    backgroundPattern:
      config.backgroundPattern === 'none'
        ? 'none'
        : (config.backgroundPattern && LOBSTER_BACKGROUND_PATTERN_MAP[config.backgroundPattern]?.id) || seeded.pattern.id,
    backgroundTexture:
      config.backgroundTexture === 'none'
        ? 'none'
        : (config.backgroundTexture && LOBSTER_BACKGROUND_TEXTURE_MAP[config.backgroundTexture]?.id) || seeded.texture.id,
  }
}

/** Head-and-shoulders frame the placeholder silhouette is drawn in. */
export const LOBSTER_PORTRAIT_VIEWBOX = '-9 -11 118 118' as const

export type LobsterAvatarFrame = 'portrait' | 'fullBody'

export interface GenerateLobsterAvatarSilhouetteOptions {
  frame?: LobsterAvatarFrame
  size?: number
}

/**
 * Empty-state placeholder: a plain carapace dome with two pairs of antennae in one benthic tone.
 * Coordinates are in LOBSTER_PORTRAIT_VIEWBOX; SILHOUETTE_FIT scales it to the size a real
 * portrait's head fills, so the porthole looks the same before and after a member makes one.
 */
export const SILHOUETTE_PATHS = {
  // Runs past the bottom of the frame, like a real portrait's body.
  dome: 'M 16 140 V 58 a 34 34 0 0 1 68 0 v 82 Z',
  antennaLeft: 'M 43 32 C 40 10 30 -10 14 -24',
  antennaRight: 'M 57 32 C 60 10 70 -10 86 -24',
  antennaGlintLeft: 'M 42 28 C 39 10 30 -8 15 -21',
  antennaGlintRight: 'M 58 28 C 61 10 70 -8 85 -21',
  antennuleLeft: 'M 46 28 C 45 15 42 4 38 -5',
  antennuleRight: 'M 54 28 C 55 15 58 4 62 -5',
} as const

/** Dome top sits where a real head's top does and matches its width (~two thirds of the ring). */
export const SILHOUETTE_FIT = 'translate(50 4) scale(1.1) translate(-50 -24)'

function silhouetteMarkup(): string {
  const s = SILHOUETTE_PATHS
  return `<defs>
      <linearGradient id="sil-benthic-grad" x1="25%" y1="0%" x2="75%" y2="100%">
        <stop offset="0%" stop-color="#1d5267" />
        <stop offset="45%" stop-color="#0e2d3a" />
        <stop offset="100%" stop-color="#030e14" />
      </linearGradient>
      <radialGradient id="sil-ambient-glow" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#00c3ff" stop-opacity="0.18" />
        <stop offset="100%" stop-color="#00c3ff" stop-opacity="0" />
      </radialGradient>
    </defs>
    <g transform="${SILHOUETTE_FIT}">
      <ellipse cx="50" cy="45" rx="34" ry="32" fill="url(#sil-ambient-glow)" />
      <g stroke="#00c3ff" stroke-linecap="round" fill="none">
        <path d="${s.antennaLeft}" stroke-width="3" stroke-opacity="0.85" />
        <path d="${s.antennaRight}" stroke-width="3" stroke-opacity="0.85" />
        <path d="${s.antennaGlintLeft}" stroke="#ffffff" stroke-width="1.2" opacity="0.35" />
        <path d="${s.antennaGlintRight}" stroke="#ffffff" stroke-width="1.2" opacity="0.35" />
        <path d="${s.antennuleLeft}" stroke-width="2.2" stroke-opacity="0.6" />
        <path d="${s.antennuleRight}" stroke-width="2.2" stroke-opacity="0.6" />
      </g>
      <path d="${s.dome}" fill="url(#sil-benthic-grad)" stroke="#00c3ff" stroke-width="1.2" stroke-opacity="0.45" stroke-linejoin="round" />
    </g>`
}

/** Inner markup of the placeholder, shared by the React component and the image version. */
export const SILHOUETTE_MARKUP = silhouetteMarkup()

export function generateLobsterAvatarSilhouetteSvg(options?: GenerateLobsterAvatarSilhouetteOptions): string {
  const sizeAttr = options?.size ? ` width="${options.size}" height="${options.size}"` : ''
  return `<svg data-avatar-slot="portrait" data-avatar-silhouette="true" xmlns="http://www.w3.org/2000/svg" viewBox="${LOBSTER_PORTRAIT_VIEWBOX}" fill="none"${sizeAttr} role="img" aria-label="Avatar not set yet">
    ${SILHOUETTE_MARKUP}
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
