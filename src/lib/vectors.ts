/**
 * The five vectors: the one stat set for members and their gear.
 *
 * A member's base comes from the Moltmax audit (the same five scores the quiz
 * produces, 0 to 100). Equipped gear adds a bonus on top, RPG style: "62 (+14)".
 * Members who have not taken the audit yet get a provisional base rolled from
 * their id, so the sheet is stable without storing anything.
 */
import type { EquipmentCategory } from '../db/schema'
import type { QuizDimension } from './moltmax-quiz'

export type VectorKey = QuizDimension
export type VectorSet = Record<VectorKey, number>
export type BaseSource = 'audit' | 'provisional'

export const VECTOR_KEYS: readonly VectorKey[] = [
  'shellHardness',
  'pincerTorque',
  'neuralLatency',
  'ecdysisDiscipline',
  'depthTolerance',
] as const

export interface VectorMeta {
  key: VectorKey
  label: string
  short: string
  description: string
  /** Gear slots that raise this vector. */
  slots: EquipmentCategory[]
}

export const VECTORS: Record<VectorKey, VectorMeta> = {
  shellHardness: {
    key: 'shellHardness',
    label: 'Shell',
    short: 'SHL',
    description: 'Holding your boundaries and taking a hit without cracking.',
    slots: ['carapace', 'belt'],
  },
  pincerTorque: {
    key: 'pincerTorque',
    label: 'Torque',
    short: 'TRQ',
    description: 'Committing to one thing and gripping it until it is finished.',
    slots: ['claws'],
  },
  neuralLatency: {
    key: 'neuralLatency',
    label: 'Synapse',
    short: 'SYN',
    description: 'How quickly a signal turns into action.',
    slots: ['head'],
  },
  ecdysisDiscipline: {
    key: 'ecdysisDiscipline',
    label: 'Ecdysis',
    short: 'ECD',
    description: 'Shedding old habits cleanly and growing the next shell.',
    slots: ['legs'],
  },
  depthTolerance: {
    key: 'depthTolerance',
    label: 'Depth',
    short: 'DEP',
    description: 'Staying steady under pressure, below the noise.',
    slots: ['antennae'],
  },
}

/** The vector each gear slot raises with its primary stat. */
export const SLOT_VECTOR: Record<EquipmentCategory, VectorKey> = {
  carapace: 'shellHardness',
  belt: 'shellHardness',
  claws: 'pincerTorque',
  head: 'neuralLatency',
  legs: 'ecdysisDiscipline',
  antennae: 'depthTolerance',
}

/** Same weights as the Moltmax audit index, so an audit base rates the same as the audit score. */
export const VECTOR_WEIGHTS: VectorSet = {
  shellHardness: 0.3,
  pincerTorque: 0.25,
  neuralLatency: 0.2,
  ecdysisDiscipline: 0.15,
  depthTolerance: 0.1,
}

export function emptyVectors(): VectorSet {
  return { shellHardness: 0, pincerTorque: 0, neuralLatency: 0, ecdysisDiscipline: 0, depthTolerance: 0 }
}

export function isVectorKey(value: unknown): value is VectorKey {
  return typeof value === 'string' && (VECTOR_KEYS as readonly string[]).includes(value)
}

/** Weighted Moltmax rating for any vector set (base, or base plus gear). */
export function moltmaxRating(set: VectorSet): number {
  return Math.max(0, Math.round(VECTOR_KEYS.reduce((sum, k) => sum + set[k] * VECTOR_WEIGHTS[k], 0)))
}

export const PROVISIONAL_MIN = 35
export const PROVISIONAL_MAX = 65

function hashSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stable starting base for a member who has not taken the audit. */
export function provisionalBase(seed: string): VectorSet {
  const rand = mulberry32(hashSeed(seed || 'initiate'))
  const set = emptyVectors()
  for (const k of VECTOR_KEYS) {
    set[k] = PROVISIONAL_MIN + Math.floor(rand() * (PROVISIONAL_MAX - PROVISIONAL_MIN + 1))
  }
  return set
}

/** Onboarding used to roll these keys into moltmaxDimensionScores. */
const LEGACY_ROLL_KEYS: Record<string, VectorKey> = {
  defense: 'shellHardness',
  attack: 'pincerTorque',
  intelligence: 'neuralLatency',
  speed: 'ecdysisDiscipline',
  perception: 'depthTolerance',
}

export interface VectorBase {
  values: VectorSet
  source: BaseSource
}

function clampScore(n: unknown): number | null {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  return Math.max(0, Math.min(100, Math.round(n)))
}

/**
 * A member's base vectors from their user_stats row. Audit scores win; an old onboarding
 * roll is kept as the provisional base; otherwise the base is rolled from the member id.
 */
export function resolveVectorBase(
  stats: { moltmaxDimensionScores?: Record<string, number> | null; moltmaxCompletedAt?: Date | string | null } | null | undefined,
  seed: string,
): VectorBase {
  const scores = stats?.moltmaxDimensionScores ?? null
  if (scores && stats?.moltmaxCompletedAt) {
    const values = emptyVectors()
    let complete = true
    for (const k of VECTOR_KEYS) {
      const v = clampScore(scores[k])
      if (v === null) complete = false
      else values[k] = v
    }
    if (complete) return { values, source: 'audit' }
  }
  if (scores) {
    const values = provisionalBase(seed)
    let found = false
    for (const [legacy, key] of Object.entries(LEGACY_ROLL_KEYS)) {
      const v = clampScore(scores[legacy])
      if (v !== null) {
        values[key] = v
        found = true
      }
    }
    if (found) return { values, source: 'provisional' }
  }
  return { values: provisionalBase(seed), source: 'provisional' }
}

export interface VectorSheet {
  base: VectorSet
  gear: VectorSet
  total: VectorSet
  source: BaseSource
  rating: { base: number; gear: number; total: number }
}

/** Base plus gear, with the Moltmax rating for each. Totals can pass 100. */
export function buildVectorSheet(base: VectorBase, gearIn: Partial<VectorSet>): VectorSheet {
  const gear = emptyVectors()
  const total = emptyVectors()
  for (const k of VECTOR_KEYS) {
    const g = gearIn[k]
    gear[k] = typeof g === 'number' && Number.isFinite(g) ? g : 0
    total[k] = base.values[k] + gear[k]
  }
  const baseRating = moltmaxRating(base.values)
  const totalRating = moltmaxRating(total)
  return {
    base: base.values,
    gear,
    total,
    source: base.source,
    rating: { base: baseRating, gear: totalRating - baseRating, total: totalRating },
  }
}

/** "+6", "-2", or "+0". */
export function formatBonus(n: number): string {
  return `${n < 0 ? '-' : '+'}${Math.abs(n)}`
}
