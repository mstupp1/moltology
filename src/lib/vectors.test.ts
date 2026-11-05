import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ALL_EQUIPMENT_CATALOG } from './equipment-seed-data'
import { computeMoltmaxResult, MOLTMAX_QUESTIONS } from './moltmax-quiz'
import {
  PROVISIONAL_MAX,
  PROVISIONAL_MIN,
  SLOT_VECTOR,
  VECTOR_KEYS,
  VECTORS,
  buildVectorSheet,
  emptyVectors,
  formatBonus,
  isVectorKey,
  moltmaxRating,
  provisionalBase,
  resolveVectorBase,
} from './vectors'

const audit = { shellHardness: 80, pincerTorque: 70, neuralLatency: 60, ecdysisDiscipline: 50, depthTolerance: 40 }

describe('vectors', () => {
  it('uses the audit scores as the base once the audit is taken', () => {
    const base = resolveVectorBase({ moltmaxDimensionScores: audit, moltmaxCompletedAt: new Date() }, 'u1')
    expect(base).toEqual({ values: audit, source: 'audit' })
  })

  it('rates an audit base the same as the audit index', () => {
    const answers = Object.fromEntries(MOLTMAX_QUESTIONS.map((q) => [q.id, q.options[1].id]))
    const result = computeMoltmaxResult(answers)
    const base = resolveVectorBase({ moltmaxDimensionScores: result.dimensionScores, moltmaxCompletedAt: new Date() }, 'u')
    expect(moltmaxRating(base.values)).toBe(result.score)
  })

  it('rolls a stable provisional base when there is no audit', () => {
    const a = resolveVectorBase(null, 'member-1')
    expect(a.source).toBe('provisional')
    expect(resolveVectorBase(undefined, 'member-1')).toEqual(a)
    for (const k of VECTOR_KEYS) {
      expect(a.values[k]).toBeGreaterThanOrEqual(PROVISIONAL_MIN)
      expect(a.values[k]).toBeLessThanOrEqual(PROVISIONAL_MAX)
    }
    expect(provisionalBase('member-2')).not.toEqual(a.values)
  })

  it('keeps an old onboarding roll as the provisional base', () => {
    const base = resolveVectorBase({ moltmaxDimensionScores: { defense: 77, attack: 41 }, moltmaxCompletedAt: null }, 'u')
    expect(base.source).toBe('provisional')
    expect(base.values.shellHardness).toBe(77)
    expect(base.values.pincerTorque).toBe(41)
  })

  it('adds gear on top of the base and lets totals pass 100', () => {
    const gear = { ...emptyVectors(), shellHardness: 30, depthTolerance: 4 }
    const sheet = buildVectorSheet({ values: { ...audit, shellHardness: 90 }, source: 'audit' }, gear)
    expect(sheet.total.shellHardness).toBe(120)
    expect(sheet.total.depthTolerance).toBe(44)
    expect(sheet.rating.total).toBe(sheet.rating.base + sheet.rating.gear)
    expect(sheet.rating.gear).toBeGreaterThan(0)
  })

  it('formats bonuses with a sign', () => {
    expect(formatBonus(6)).toBe('+6')
    expect(formatBonus(0)).toBe('+0')
    expect(formatBonus(-2)).toBe('-2')
  })

  it('gives every gear slot a vector and every vector a slot', () => {
    for (const k of VECTOR_KEYS) {
      for (const slot of VECTORS[k].slots) expect(SLOT_VECTOR[slot]).toBe(k)
    }
  })

  it('keeps gear bonuses on the small scale, rarer pieces higher', () => {
    const order = ['common', 'uncommon', 'rare', 'epic', 'legendary'] as const
    const best: Record<string, number> = {}
    const worst: Record<string, number> = {}
    for (const c of ALL_EQUIPMENT_CATALOG) {
      if (c.kind === 'cosmetic') continue
      for (const a of c.affixes) expect(isVectorKey(a.stat)).toBe(true)
      expect(c.primaryStat).toBeGreaterThan(0)
      expect(c.primaryStat).toBeLessThanOrEqual(20)
      best[c.rarity] = Math.max(best[c.rarity] ?? 0, c.primaryStat)
      worst[c.rarity] = Math.min(worst[c.rarity] ?? 99, c.primaryStat)
    }
    for (let i = 1; i < order.length; i++) {
      expect(worst[order[i]]).toBeGreaterThanOrEqual(worst[order[i - 1]])
      expect(best[order[i]]).toBeGreaterThan(best[order[i - 1]])
    }
  })

  it('ships the current gear numbers in the stats migration', () => {
    const sql = readFileSync('drizzle/0060_vector_stats.sql', 'utf8')
    for (const c of ALL_EQUIPMENT_CATALOG) {
      if (c.kind === 'cosmetic') continue
      expect(sql).toContain(`('${c.id}'::uuid,${c.primaryStat},'${JSON.stringify(c.affixes)}'::jsonb)`)
    }
  })
})
