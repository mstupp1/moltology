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
  // Pressed lips are a thin dark line, not the resting smile: a mid-word close must not read as a grin.
  A: { open: 0.075, width: 0.82, teethUp: 0, teethLo: 0, bite: 0, tongueUp: 0, press: 1, speech: 0 },
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

/** Between words in a phrase the mouth relaxes slightly open rather than snapping shut. */
export const MOUTH_RELAXED: MouthParams = { open: 0.14, width: 0.98, teethUp: 0.35, teethLo: 0, bite: 0, tongueUp: 0, press: 0, speech: 1 }

const mix = (a: MouthParams, b: MouthParams, k: number) => blendMouth({ ...a }, b, k)
/** How different two mouths look: mostly how open, then how wide. */
const distance = (a: MouthParams, b: MouthParams) => Math.abs(a.open - b.open) + 0.6 * Math.abs(a.width - b.width)

/**
 * The drawn mouth for every frame of a speech track (one MOUTH_SHAPES letter a frame), or null where
 * the character is not speaking and its own face takes over. This is the animator's pass over the
 * shape chart:
 * - size: stressed words open bigger and little words smaller (`size` per frame, 0..1, 0.5 plain);
 * - in-betweens: a big change (wide open to shut, a pucker to a grin) gets one halfway frame when
 *   the new shape holds long enough to land after it; small changes and lip closes snap, so the
 *   mouth stays crisp like a drawn one;
 * - pauses: a short gap inside a phrase relaxes the lips slightly apart; at the end of a line the
 *   last shape holds a beat, then eases shut over a few frames.
 */
export function speechMouthTrack(letters: string, options: { fps: number; size?: number[] }): (MouthParams | null)[] {
  const { fps, size } = options
  const out: (MouthParams | null)[] = new Array(letters.length).fill(null)
  const runs: { shape: MouthShape; from: number; to: number }[] = []
  for (let f = 0; f < letters.length; f++) {
    const shape = isMouthShape(letters[f]) ? (letters[f] as MouthShape) : 'X'
    const last = runs[runs.length - 1]
    if (last && last.shape === shape) last.to = f + 1
    else runs.push({ shape, from: f, to: f + 1 })
  }
  const relaxFor = Math.round(fps * 0.35)
  const hold = Math.max(1, Math.round(fps / 15))
  const ease = [0.45, 0.75, 0.92]
  let prev: MouthParams | null = null
  runs.forEach((run, i) => {
    const length = run.to - run.from
    if (run.shape === 'X') {
      const before = prev
      const speechAfter = runs.slice(i + 1).some((r) => r.shape !== 'X')
      if (!before) return
      if (speechAfter && length <= relaxFor) {
        for (let f = run.from; f < run.to; f++) out[f] = f === run.from ? mix(before, MOUTH_RELAXED, 0.6) : { ...MOUTH_RELAXED }
        prev = out[run.to - 1]
        return
      }
      // End of a line or a real pause: hold, then ease shut, then the face is the character's own.
      const shut = { ...MOUTH_PARAMS.X, speech: before.speech }
      for (let k = 0; k < hold + ease.length && run.from + k < run.to; k++) {
        out[run.from + k] = k < hold ? { ...before } : mix(before, shut, ease[k - hold])
      }
      prev = null
      return
    }
    for (let f = run.from; f < run.to; f++) {
      const want = { ...MOUTH_PARAMS[run.shape], speech: 1 }
      const s = size?.[f] ?? 0.5
      // Pressed lips stay one thin line whatever the stress.
      if (run.shape !== 'A') want.open = Math.min(1.3, want.open * (0.62 + 0.76 * s))
      // The first frame of a big change is halfway there, when the new shape holds long enough to
      // land after it (a lip close needs its frames shut, so it only eases in when it holds 3).
      const landsAfter = length >= (run.shape === 'A' ? 3 : 2)
      out[f] = f === run.from && prev && landsAfter && distance(prev, want) > 0.45 ? mix(prev, want, 0.6) : want
      prev = out[f]
    }
  })
  return out
}
