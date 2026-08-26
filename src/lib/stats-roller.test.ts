import { describe, it, expect } from 'vitest'
import {
  rollBaseStats,
  adjustStat,
  getDominantArchetype,
  calculateStatSum,
  TOTAL_STAT_POINTS,
  STAT_MIN,
  STAT_MAX,
  STAT_KEYS,
  DEFAULT_BASE_STATS,
  LARVAL_ARCHETYPES,
  type BaseStats,
} from './stats-roller'

describe('stats-roller engine (Chassis Alignment)', () => {
  it('default base stats sum to TOTAL_STAT_POINTS (300)', () => {
    expect(calculateStatSum(DEFAULT_BASE_STATS)).toBe(TOTAL_STAT_POINTS)
    STAT_KEYS.forEach((key) => {
      expect(DEFAULT_BASE_STATS[key]).toBeGreaterThanOrEqual(STAT_MIN)
      expect(DEFAULT_BASE_STATS[key]).toBeLessThanOrEqual(STAT_MAX)
    })
  })

  it('rollBaseStats generates valid rolls strictly summing to 300 across 100 trials', () => {
    for (let i = 0; i < 100; i++) {
      const stats = rollBaseStats()
      const sum = calculateStatSum(stats)
      expect(sum).toBe(TOTAL_STAT_POINTS)

      STAT_KEYS.forEach((key) => {
        expect(stats[key]).toBeGreaterThanOrEqual(STAT_MIN)
        expect(stats[key]).toBeLessThanOrEqual(STAT_MAX)
        expect(Number.isInteger(stats[key])).toBe(true)
      })
    }
  })

  it('adjustStat increases target stat and compensates from another to maintain 300 sum', () => {
    const initial: BaseStats = {
      defense: 60,
      attack: 60,
      intelligence: 60,
      speed: 60,
      perception: 60,
    }

    const updated = adjustStat(initial, 'defense', 5)
    expect(calculateStatSum(updated)).toBe(TOTAL_STAT_POINTS)
    expect(updated.defense).toBe(65)
    const totalOthers = calculateStatSum(updated) - updated.defense
    expect(totalOthers).toBe(235)
  })

  it('adjustStat respects STAT_MIN and STAT_MAX bounds', () => {
    const maxed: BaseStats = {
      defense: 85,
      attack: 55,
      intelligence: 55,
      speed: 55,
      perception: 50,
    }

    // Trying to increase beyond max returns unchanged
    const cannotIncrease = adjustStat(maxed, 'defense', 1)
    expect(cannotIncrease.defense).toBe(85)

    const mined: BaseStats = {
      defense: 35,
      attack: 65,
      intelligence: 65,
      speed: 65,
      perception: 70,
    }

    // Trying to decrease below min returns unchanged
    const cannotDecrease = adjustStat(mined, 'defense', -1)
    expect(cannotDecrease.defense).toBe(35)
  })

  it('getDominantArchetype correctly derives the highest stat archetype', () => {
    STAT_KEYS.forEach((dominantKey) => {
      const stats: BaseStats = {
        defense: 50,
        attack: 50,
        intelligence: 50,
        speed: 50,
        perception: 50,
      }
      stats[dominantKey] = 80 // strictly highest

      const archetype = getDominantArchetype(stats)
      expect(dominantKey in LARVAL_ARCHETYPES).toBe(true)
      expect(archetype.dominantStat).toBe(dominantKey)
      expect(archetype.title).toBe(LARVAL_ARCHETYPES[dominantKey].title)
    })
  })
})
