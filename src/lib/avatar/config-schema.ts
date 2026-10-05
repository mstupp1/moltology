/** Shared validation for saved avatar configs, built from the trait catalogs. */
import { z } from 'zod'
import {
  AVATAR_ACCESSORIES,
  AVATAR_ANTENNAE,
  AVATAR_BUILDS,
  AVATAR_CLAWS,
  AVATAR_HEAD_SHAPES,
  AVATAR_MOUTHS,
  AVATAR_POSES,
  AVATAR_RACES,
  SHELL_FINISHES,
  SHELL_MARKINGS,
  SHELL_PALETTES,
} from './traits'

const shellColorIds = SHELL_PALETTES.map((p) => p.id) as [string, ...string[]]

export const avatarConfigShape = {
  style: z.string().min(1).max(64),
  seed: z.string().min(1).max(128),
  race: z.enum(AVATAR_RACES).optional(),
  shellColor: z.enum(shellColorIds).optional(),
  shellFinish: z.enum(SHELL_FINISHES).optional(),
  marking: z.enum(SHELL_MARKINGS).optional(),
  mouth: z.enum(AVATAR_MOUTHS).optional(),
  antennae: z.enum(AVATAR_ANTENNAE).optional(),
  claws: z.enum(AVATAR_CLAWS).optional(),
  pose: z.enum(AVATAR_POSES).optional(),
  accessory: z.enum(AVATAR_ACCESSORIES).optional(),
  headShape: z.enum(AVATAR_HEAD_SHAPES).optional(),
  build: z.enum(AVATAR_BUILDS).optional(),
  height: z.union([z.enum(['short', 'regular', 'tall', 'towering']), z.number().min(0.75).max(1.4)]).optional(),
  armScale: z.number().min(0.7).max(1.4).optional(),
  backgroundTheme: z.string().max(64).optional(),
  backgroundPattern: z.string().max(64).optional(),
  backgroundTexture: z.string().max(64).optional(),
  patternDensity: z.enum(['compact', 'standard', 'spacious']).optional(),
  patternGlow: z.enum(['subtle', 'chromatic', 'none']).optional(),
  patternPulse: z.enum(['pulse', 'steady']).optional(),
  patternSparkles: z.enum(['subtle', 'radiant', 'none']).optional(),
  eyelidStyle: z.enum(['open', 'relaxed', 'cheerful_squint', 'focused', 'chill', 'angry', 'worried']).optional(),
  eyeColor: z.enum(['amber', 'sapphire', 'emerald', 'amethyst', 'ruby', 'topaz']).optional(),
  eyeVariant: z.enum(['round', 'wide', 'tall']).optional(),
  pupilVariant: z.enum(['standard', 'big', 'sparkle', 'keen']).optional(),
  backgroundMotion: z.enum(['drift_diagonal', 'drift_horizontal', 'radar_sweep', 'wave_undulate', 'pulse_breathe', 'static']).optional(),
  transparentBackground: z.boolean().optional(),
}

/** Optional look fields copied verbatim into the stored config when present. */
export const AVATAR_STORED_OPTIONAL_KEYS = Object.keys(avatarConfigShape).filter(
  (k) => k !== 'style' && k !== 'seed'
) as (keyof typeof avatarConfigShape)[]
