/**
 * What a 3D character is built from. It mirrors the saved avatar settings one for one, so the
 * same stored config drives either renderer.
 */
import type { CharacterSpec } from '../avatar/spec'
import { resolveAvatarTraits, resolveHeightScale, resolveTemperament, type LobsterAvatarConfig } from '../lobster-avatar'
import { SHELL_PALETTE_MAP, SHELL_PALETTES, type ShellFinish, type ShellMarking, type ShellPalette } from '../avatar/traits'

export interface Avatar3DLook extends CharacterSpec {
  palette: ShellPalette
  finish: ShellFinish
  marking: ShellMarking
  /** Palette ids for a belly or marking in another colour than the shell's own. */
  bellyColor?: string
  markingColor?: string
  /** Size of the marking, 0.5 (fine) to 1.8 (bold). */
  markingScale?: number
}

/** The approved reference look for a species: coral shell, green eyes, easy smile. */
export function baselineLook(race: Avatar3DLook['race']): Avatar3DLook {
  return {
    race,
    palette: SHELL_PALETTE_MAP.coral ?? SHELL_PALETTES[0],
    finish: 'satin',
    marking: 'none',
    eyeColor: 'emerald',
    eyeShape: 'round',
    pupil: 'standard',
    expression: 'relaxed',
    gaze: 'ahead',
    mouth: 'smile',
    antennae: 'whip',
    claws: 'classic',
    pose: 'rest',
    accessory: 'none',
    headShape: 'bean',
    build: 'classic',
    heightScale: 1,
    armScale: 1,
  }
}

/**
 * The 3D look for a saved character. It resolves the config exactly as the 2D renderer does
 * (seeded defaults included), so one stored character looks like the same character in both.
 */
export function lookFromConfig(config: LobsterAvatarConfig): Avatar3DLook {
  const traits = resolveAvatarTraits(config)
  return {
    race: traits.race,
    palette: SHELL_PALETTE_MAP[traits.shellColor] ?? SHELL_PALETTES[0],
    finish: traits.shellFinish,
    marking: traits.marking,
    eyeColor: traits.eyeColor,
    eyeShape: traits.eyeVariant,
    pupil: traits.pupilVariant,
    expression: traits.eyelidStyle,
    gaze: traits.gaze,
    mouth: traits.mouth,
    antennae: traits.antennae,
    // Claw styles and hats are equipment now, as in the 2D renderer.
    claws: 'classic',
    pose: traits.pose,
    accessory: 'none',
    equipment: config.equipment,
    headShape: traits.headShape,
    build: traits.build,
    heightScale: resolveHeightScale(traits.height),
    armScale: typeof config.armScale === 'number' ? Math.min(1.3, Math.max(0.8, config.armScale)) : 1,
    headScale: typeof config.headScale === 'number' ? Math.min(1.14, Math.max(0.88, config.headScale)) : 1,
    temperament: resolveTemperament(config),
    bellyColor: config.bellyColor,
    markingColor: config.markingColor,
    markingScale: config.markingScale,
  }
}

/** Fields that only change how a character moves, and fields that only change its paint. */
const MOTION_KEYS = ['pose', 'temperament'] as const
const PAINT_KEYS = ['palette', 'finish', 'marking', 'eyeColor', 'pupil', 'bellyColor', 'markingColor', 'markingScale'] as const

/**
 * What it takes to turn one look into another: nothing but new bone targets (`motion`), a repaint
 * of the materials (`paint`), or a rebuilt body (`shape`).
 */
export function lookChange(from: Avatar3DLook, to: Avatar3DLook): 'motion' | 'paint' | 'shape' {
  const strip = (look: Avatar3DLook, keys: readonly string[]) => {
    const rest: Record<string, unknown> = { ...look }
    for (const key of keys) delete rest[key]
    return JSON.stringify(rest)
  }
  if (strip(from, [...MOTION_KEYS, ...PAINT_KEYS]) !== strip(to, [...MOTION_KEYS, ...PAINT_KEYS])) return 'shape'
  const paint = (look: Avatar3DLook) => JSON.stringify(PAINT_KEYS.map((key) => (key === 'palette' ? look.palette.id : (look as unknown as Record<string, unknown>)[key])))
  return paint(from) === paint(to) ? 'motion' : 'paint'
}
