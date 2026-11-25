import { describe, expect, it } from 'vitest'
import {
  ARCADE_GAMES,
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
    expect(isArcadeGameId('current-runner')).toBe(true)
    expect(isArcadeGameId('vent-hopper')).toBe(true)
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
    expect(arcadeRunEarnsXp(riptide, riptide.minRewardScore, 0)).toBe(true)
    expect(arcadeRunEarnsXp(riptide, riptide.minRewardScore - 1, 0)).toBe(false)
    expect(arcadeRunEarnsXp(riptide, 50, ARCADE_XP_RUNS_PER_DAY)).toBe(false)
    const runner = ARCADE_GAMES['current-runner']
    expect(arcadeRunEarnsXp(runner, 50, 0)).toBe(false)
    expect(arcadeRunEarnsXp(runner, runner.minRewardScore, 0)).toBe(true)
  })

  it('pays the weekly top 10 only', () => {
    expect(arcadeWeeklyGems(1)).toBe(100)
    expect(arcadeWeeklyGems(10)).toBe(25)
    expect(arcadeWeeklyGems(11)).toBe(0)
  })
})
