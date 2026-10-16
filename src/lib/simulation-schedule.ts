/** Ticks per simulated day (the original twice-daily cadence). */
export const TICKS_PER_DAY = 2
export const DAILY_TICKS = TICKS_PER_DAY
/** A week of activity in one run: 7 days at the daily tick rate. */
export const WEEKLY_TICKS = 7 * TICKS_PER_DAY

const HOUR_MS = 60 * 60 * 1000

/** Small deterministic PRNG so a schedule can be reproduced from a seed. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Spread `totalTicks` timestamps across the `days` days ending at `now`.
 *
 * The window is cut into equal slots (12h for the weekly default). Each tick lands at a
 * random point inside its slot, so ticks are ordered oldest to newest, never in the
 * future, and never bunched together. The final slot ends a few minutes before `now`.
 */
export function buildTickSchedule(options: {
  now?: Date
  days?: number
  totalTicks?: number
  rng?: () => number
  endMarginMinutes?: number
}): Date[] {
  const now = options.now ?? new Date()
  const days = options.days ?? 7
  const totalTicks = options.totalTicks ?? days * TICKS_PER_DAY
  const rng = options.rng ?? Math.random
  const margin = (options.endMarginMinutes ?? 5) * 60 * 1000

  if (totalTicks <= 0) return []
  const end = now.getTime() - margin
  const start = end - days * 24 * HOUR_MS
  const slot = (end - start) / totalTicks

  return Array.from({ length: totalTicks }, (_, i) => {
    // Keep 5%-95% of the slot so neighbouring ticks never touch.
    const offset = (0.05 + rng() * 0.9) * slot
    return new Date(Math.floor(start + i * slot + offset))
  })
}
