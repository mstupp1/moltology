/**
 * What a 3D character is built from. It mirrors the saved avatar settings one for one, so the
 * same stored config drives either renderer.
 */
import type { CharacterSpec } from '../avatar/races'
import { SHELL_PALETTE_MAP, SHELL_PALETTES, type ShellFinish, type ShellMarking, type ShellPalette } from '../avatar/traits'

export interface Avatar3DLook extends Omit<CharacterSpec, 'equipment'> {
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
