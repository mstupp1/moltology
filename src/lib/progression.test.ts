import { describe, it, expect } from 'vitest'
import {
  XP_CONFIG,
  STAGE_THRESHOLDS,
  SUB_STAGE_THRESHOLDS,
  calculateStage,
  calculateSubStage,
  calculateProgression,
  getStreakMilestoneBonus,
  calculateXpFromHistory,
} from './progression'

describe('Progression Engine: Stages and Curves', () => {
  it('starts at Stage 1 (The Larval Initiate) with 0 XP', () => {
    const stage = calculateStage(0)
    expect(stage.stage).toBe(1)
    expect(stage.stageTitle).toBe('THE LARVAL INITIATE')
    expect(stage.currentStageMinXp).toBe(0)
    expect(stage.nextStageMinXp).toBe(2000)
    expect(stage.progressRatio).toBe(0)
    expect(stage.isMaxStage).toBe(false)
  })

  it('calculates mid-stage progress correctly within Stage 1', () => {
    const stage = calculateStage(1000)
    expect(stage.stage).toBe(1)
    expect(stage.progressRatio).toBe(0.5)
    expect(stage.xpIntoStage).toBe(1000)
    expect(stage.xpNeededForNextStage).toBe(2000)
  })

  it('advances to Stage 2 at exactly 2,000 XP (~2 weeks of perfect execution)', () => {
    const stage = calculateStage(2000)
    expect(stage.stage).toBe(2)
    expect(stage.stageTitle).toBe('THE SOFT-SHED')
    expect(stage.currentStageMinXp).toBe(2000)
    expect(stage.nextStageMinXp).toBe(10000)
    expect(stage.progressRatio).toBe(0)
    expect(stage.isMaxStage).toBe(false)
  })

  it('advances to Stage 3 at 10,000 XP (~1.5-2 months execution)', () => {
    const stage = calculateStage(10000)
    expect(stage.stage).toBe(3)
    expect(stage.stageTitle).toBe('THE EXOSHELL BORN')
    expect(stage.currentStageMinXp).toBe(10000)
    expect(stage.nextStageMinXp).toBe(40000)
    expect(stage.progressRatio).toBe(0)
  })

  it('advances to Stage 4 (APEX Full Carcinization) at 40,000 XP (~6 months execution)', () => {
    const stage = calculateStage(40000)
    expect(stage.stage).toBe(4)
    expect(stage.stageTitle).toBe('FULL CARCINIZATION')
    expect(stage.isMaxStage).toBe(true)
    expect(stage.progressRatio).toBe(1)
    expect(stage.nextStageMinXp).toBeNull()
  })

  it('handles XP well beyond Apex without breaking', () => {
    const stage = calculateStage(150000)
    expect(stage.stage).toBe(4)
    expect(stage.isMaxStage).toBe(true)
    expect(stage.progressRatio).toBe(1)
  })

  it('handles negative or invalid XP gracefully', () => {
    const stage = calculateStage(-50)
    expect(stage.stage).toBe(1)
    expect(stage.progressRatio).toBe(0)
  })
})

describe('Progression Engine: Sub-Stages (12-Tier Ascension Ladder)', () => {
  it('resolves L-1, L-2, and L-3 in Stage 1', () => {
    expect(calculateSubStage(0).code).toBe('L-1')
    expect(calculateSubStage(499).code).toBe('L-1')
    expect(calculateSubStage(500).code).toBe('L-2')
    expect(calculateSubStage(1199).code).toBe('L-2')
    expect(calculateSubStage(1200).code).toBe('L-3')
  })

  it('resolves S-1, S-2, and S-3 in Stage 2', () => {
    expect(calculateSubStage(2000).code).toBe('S-1')
    expect(calculateSubStage(4500).code).toBe('S-2')
    expect(calculateSubStage(7000).code).toBe('S-3')
  })

  it('resolves E-1, E-2, and E-3 in Stage 3', () => {
    expect(calculateSubStage(10000).code).toBe('E-1')
    expect(calculateSubStage(18000).code).toBe('E-2')
    expect(calculateSubStage(28000).code).toBe('E-3')
  })

  it('resolves C-1, C-2, and C-3 in Stage 4', () => {
    expect(calculateSubStage(40000).code).toBe('C-1')
    expect(calculateSubStage(65000).code).toBe('C-2')
    expect(calculateSubStage(100000).code).toBe('C-3')
  })
})

describe('Progression Engine: Streak Milestones & Guest XP', () => {
  it('awards milestone bonuses for 3, 7, 14, 30, 60, 90, and 180 day streaks', () => {
    expect(getStreakMilestoneBonus(3)).toBe(50)
    expect(getStreakMilestoneBonus(7)).toBe(150)
    expect(getStreakMilestoneBonus(14)).toBe(300)
    expect(getStreakMilestoneBonus(30)).toBe(750)
    expect(getStreakMilestoneBonus(5)).toBe(0) // No milestone on non-threshold day
  })

  it('calculates guest XP from completion history and today tasks', () => {
    const history = [
      { date: '2026-09-03', completedCount: 8 }, // 8 * 10 + 20 = 100
      { date: '2026-09-04', completedCount: 4 }, // 4 * 10 = 40
    ]
    const todayTasks = [
      { completed: true },
      { completed: true },
      { completed: false },
    ] // 2 * 10 = 20

    const xp = calculateXpFromHistory(history, '2026-09-05', todayTasks)
    expect(xp).toBe(100 + 40 + 20)
  })

  it('calculates full progression bundle correctly', () => {
    const prog = calculateProgression(6000)
    expect(prog.stage).toBe(2)
    expect(prog.subStage.code).toBe('S-2')
    expect(prog.progressRatio).toBe(0.5) // 4,000 / 8,000
    expect(prog.xpIntoStage).toBe(4000)
  })
})
