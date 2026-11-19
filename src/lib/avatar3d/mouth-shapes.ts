/**
 * Cartoon mouth shapes for speech: the classic animator's chart (Preston Blair, as used by
 * Hanna-Barbera and most TV cartoons since), in the nine-letter form Rhubarb Lip Sync writes.
 * Each shape is a few numbers for the 3D mouth: how far the dark oval opens, how wide it is, how
 * much of each row of teeth shows and where the tongue sits.
 */

/** Half-sizes of the open-mouth oval at a scale of 1 (species.ts builds it this size). */
export const MOUTH_HOLE = { x: 0.08, y: 0.048, z: 0.016 } as const

/**
 * X rest (the character's own drawn mouth) · A lips pressed (M, B, P) · B teeth together, lips
 * apart (most consonants: K, S, T, EE) · C open (EH, AE) · D wide open (AA) · E rounded (AO, ER)
 * · F small pucker (OO, W) · G top teeth on the lower lip (F, V) · H tongue up (L).
 */
export const MOUTH_SHAPES = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const
export type MouthShape = (typeof MOUTH_SHAPES)[number]

export interface MouthParams {
  /** How far the oval opens (0 shut, 1 the full height). */
  open: number
  /** Width of the oval against the plain open mouth. */
  width: number
  /** How much of the top and bottom rows of teeth show (0 hidden, 1 a full row). */
  teethUp: number
  teethLo: number
  /** How far the top teeth come down over the lower lip (G). */
  bite: number
  /** 0 the tongue lies on the floor of the mouth, 1 it touches the top teeth (H). */
  tongueUp: number
  /** How much the drawn mouth narrows when the lips press together (A). */
  press: number
  /** 1 while speaking a shape: speech mouths are drawn a size up from a reaction's. */
  speech: number
}

export const MOUTH_PARAMS: Record<MouthShape, MouthParams> = {
  X: { open: 0, width: 1, teethUp: 0, teethLo: 0, bite: 0, tongueUp: 0, press: 0, speech: 0 },
  A: { open: 0, width: 0.9, teethUp: 0, teethLo: 0, bite: 0, tongueUp: 0, press: 1, speech: 0 },
  B: { open: 0.3, width: 1.08, teethUp: 1, teethLo: 1, bite: 0, tongueUp: 0, press: 0, speech: 0 },
  C: { open: 0.58, width: 1.02, teethUp: 0.9, teethLo: 0.35, bite: 0, tongueUp: 0, press: 0, speech: 0 },
  D: { open: 1, width: 1.06, teethUp: 0.75, teethLo: 0, bite: 0, tongueUp: 0, press: 0, speech: 0 },
  E: { open: 0.66, width: 0.66, teethUp: 0, teethLo: 0, bite: 0, tongueUp: 0, press: 0, speech: 0 },
  F: { open: 0.38, width: 0.42, teethUp: 0, teethLo: 0, bite: 0, tongueUp: 0, press: 0, speech: 0 },
  G: { open: 0.34, width: 0.98, teethUp: 1, teethLo: 0, bite: 1, tongueUp: 0, press: 0, speech: 0 },
  H: { open: 0.72, width: 0.98, teethUp: 0.7, teethLo: 0, bite: 0, tongueUp: 1, press: 0, speech: 0 },
}

const KEYS = Object.keys(MOUTH_PARAMS.X) as (keyof MouthParams)[]

/** Copy of a shape's numbers, to blend from. */
export function mouthParams(shape: MouthShape = 'X'): MouthParams {
  return { ...MOUTH_PARAMS[shape] }
}

/** Move `now` toward `target` by k (0 stays, 1 lands). */
export function blendMouth(now: MouthParams, target: MouthParams, k: number): MouthParams {
  for (const key of KEYS) now[key] += (target[key] - now[key]) * k
  return now
}

export const isMouthShape = (value: unknown): value is MouthShape => typeof value === 'string' && (MOUTH_SHAPES as readonly string[]).includes(value)
