/**
 * What a 3D character is built from. It mirrors the saved avatar settings one for one, so the
 * same stored config drives either renderer.
 */
import type { CharacterSpec } from '../avatar/races'
import { resolveAvatarTraits, resolveHeightScale, type LobsterAvatarConfig } from '../lobster-avatar'
import { SHELL_PALETTE_MAP, SHELL_PALETTES, type ShellFinish, type ShellMarking, type ShellPalette } from '../avatar/traits'

export interface Avatar3DLook extends CharacterSpec {
  palette: ShellPalette
  finish: ShellFinish
  marking: ShellMarking
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
  }
}
