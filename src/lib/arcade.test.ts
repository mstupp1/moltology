import { describe, expect, it } from 'vitest'
import {
  ARCADE_GAMES,
  ARCADE_MIN_REWARD_SCORE,
  ARCADE_XP_RUNS_PER_DAY,
  arcadeRunEarnsXp,
  arcadeScoreCeiling,
  arcadeWeeklyGems,
  isArcadeGameId,
  isPlausibleScore,
} from './arcade'

const riptide = ARCADE_GAMES.riptide

describe('arcade rules', () => {
  it('knows its games', () => {
    expect(isArcadeGameId('riptide')).toBe(true)
    expect(isArcadeGameId('pong')).toBe(false)
  })

  it('refuses scores faster than the game allows', () => {
    expect(arcadeScoreCeiling(riptide, 0)).toBe(1)
    expect(isPlausibleScore(riptide, 10, 10_000)).toBe(true)
    expect(isPlausibleScore(riptide, 50, 10_000)).toBe(false)
    expect(isPlausibleScore(riptide, -1, 10_000)).toBe(false)
    expect(isPlausibleScore(riptide, 2.5, 10_000)).toBe(false)
  })

  it('caps rewarded runs per day', () => {
    expect(arcadeRunEarnsXp(ARCADE_MIN_REWARD_SCORE, 0)).toBe(true)
    expect(arcadeRunEarnsXp(ARCADE_MIN_REWARD_SCORE - 1, 0)).toBe(false)
    expect(arcadeRunEarnsXp(50, ARCADE_XP_RUNS_PER_DAY)).toBe(false)
  })

  it('pays the weekly top 10 only', () => {
    expect(arcadeWeeklyGems(1)).toBe(100)
    expect(arcadeWeeklyGems(10)).toBe(25)
    expect(arcadeWeeklyGems(11)).toBe(0)
  })
})
