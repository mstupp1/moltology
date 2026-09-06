import { STAGE_PIPELINE_DATA, type SubStageInfo } from './codexData'
import { TOTAL_ALIGNMENT_TASKS } from './alignment-tasks'

export interface StreakMilestone {
  days: number
  bonusXp: number
}

export interface ProgressionConfig {
  taskCompletionXp: number
  allTasksDailyBonusXp: number
  dailyStreakBonusPerDay: number
  maxDailyStreakBonus: number
  streakMilestones: StreakMilestone[]
}

export const XP_CONFIG: ProgressionConfig = {
  taskCompletionXp: 10,
  allTasksDailyBonusXp: 20,
  dailyStreakBonusPerDay: 5,
  maxDailyStreakBonus: 50,
  streakMilestones: [
    { days: 3, bonusXp: 50 },
    { days: 7, bonusXp: 150 },
    { days: 14, bonusXp: 300 },
    { days: 30, bonusXp: 750 },
    { days: 60, bonusXp: 1500 },
    { days: 90, bonusXp: 2500 },
    { days: 180, bonusXp: 5000 },
  ],
}

export interface StageThreshold {
  stage: number
  title: string
  stageCode: string
  minXp: number
  maxXp: number | null // null for apex stage
}

export const STAGE_THRESHOLDS: StageThreshold[] = [
  {
    stage: 1,
    title: 'THE LARVAL INITIATE',
    stageCode: 'STAGE_01_LARVAL',
    minXp: 0,
    maxXp: 2000,
  },
  {
    stage: 2,
    title: 'THE SOFT-SHED',
    stageCode: 'STAGE_02_SOFTSHED',
    minXp: 2000,
    maxXp: 10000,
  },
  {
    stage: 3,
    title: 'THE EXOSHELL BORN',
    stageCode: 'STAGE_03_EXOSHELL',
    minXp: 10000,
    maxXp: 40000,
  },
  {
    stage: 4,
    title: 'FULL CARCINIZATION',
    stageCode: 'STAGE_04_ASCENDANT',
    minXp: 40000,
    maxXp: null,
  },
]

export interface SubStageThreshold {
  code: string
  stageNum: number
  minXp: number
}

export const SUB_STAGE_THRESHOLDS: SubStageThreshold[] = [
  // Stage 1
  { code: 'L-1', stageNum: 1, minXp: 0 },
  { code: 'L-2', stageNum: 1, minXp: 500 },
  { code: 'L-3', stageNum: 1, minXp: 1200 },
  // Stage 2
  { code: 'S-1', stageNum: 2, minXp: 2000 },
  { code: 'S-2', stageNum: 2, minXp: 4500 },
  { code: 'S-3', stageNum: 2, minXp: 7000 },
  // Stage 3
  { code: 'E-1', stageNum: 3, minXp: 10000 },
  { code: 'E-2', stageNum: 3, minXp: 18000 },
  { code: 'E-3', stageNum: 3, minXp: 28000 },
  // Stage 4
  { code: 'C-1', stageNum: 4, minXp: 40000 },
  { code: 'C-2', stageNum: 4, minXp: 65000 },
  { code: 'C-3', stageNum: 4, minXp: 100000 },
]

export interface CalculatedStage {
  stage: number
  stageTitle: string
  stageCode: string
  currentStageMinXp: number
  nextStageMinXp: number | null
  xpIntoStage: number
  xpNeededForNextStage: number
  progressRatio: number
  isMaxStage: boolean
}

export interface ProgressionState extends CalculatedStage {
  xp: number
  subStage: SubStageInfo & { stageNum: number; minXp: number }
}

/**
 * Calculates current macro-stage metrics from total lifetime XP.
 */
export function calculateStage(xp: number): CalculatedStage {
  const safeXp = Math.max(0, Math.floor(xp || 0))

  let matchedStage = STAGE_THRESHOLDS[0]
  for (let i = STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeXp >= STAGE_THRESHOLDS[i].minXp) {
      matchedStage = STAGE_THRESHOLDS[i]
      break
    }
  }

  const isMaxStage = matchedStage.stage >= 4 || matchedStage.maxXp === null
  const currentStageMinXp = matchedStage.minXp
  const nextStageMinXp = matchedStage.maxXp

  let progressRatio = 0
  let xpIntoStage = safeXp - currentStageMinXp
  let xpNeededForNextStage = 0

  if (isMaxStage) {
    progressRatio = 1
    xpNeededForNextStage = 0
  } else if (nextStageMinXp !== null) {
    const span = nextStageMinXp - currentStageMinXp
    xpIntoStage = Math.max(0, Math.min(safeXp - currentStageMinXp, span))
    xpNeededForNextStage = span
    progressRatio = span > 0 ? Math.min(1, Math.max(0, xpIntoStage / span)) : 0
  }

  return {
    stage: matchedStage.stage,
    stageTitle: matchedStage.title,
    stageCode: matchedStage.stageCode,
    currentStageMinXp,
    nextStageMinXp,
    xpIntoStage,
    xpNeededForNextStage,
    progressRatio,
    isMaxStage,
  }
}

/**
 * Resolves the active 12-tier sub-stage from lifetime XP.
 */
export function calculateSubStage(xp: number): SubStageInfo & { stageNum: number; minXp: number } {
  const safeXp = Math.max(0, Math.floor(xp || 0))

  let targetSub = SUB_STAGE_THRESHOLDS[0]
  for (let i = SUB_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (safeXp >= SUB_STAGE_THRESHOLDS[i].minXp) {
      targetSub = SUB_STAGE_THRESHOLDS[i]
      break
    }
  }

  const stageData = STAGE_PIPELINE_DATA.find((s) => s.stageNum === targetSub.stageNum)
  const subInfo = stageData?.subStages.find((s) => s.code === targetSub.code)

  if (subInfo && stageData) {
    return {
      ...subInfo,
      stageNum: targetSub.stageNum,
      minXp: targetSub.minXp,
    }
  }

  // Fallback to L-1
  return {
    code: 'L-1',
    title: 'Sub-Stage 1.1: Molt Curious',
    shortTitle: 'Molt Curious',
    protocol: 'The Surface Noise Audit',
    requirement: 'Run the Moltmaxxing Audit once.',
    metricThreshold: 'Shell Hardness 0% - 10%',
    shellHardnessTarget: 10,
    pincerTorqueTarget: '0 - 50 Nm',
    submergenceDepth: '0 - 100 meters',
    stageNum: 1,
    minXp: 0,
  }
}

/**
 * Generates full progression state for a user's XP, optionally adhering to an explicit stage override.
 */
export function calculateProgression(xp: number, overrideStage?: number): ProgressionState {
  const safeXp = Math.max(0, Math.floor(xp || 0))
  const stageData = calculateStage(safeXp)
  const subStage = calculateSubStage(safeXp)

  if (overrideStage && overrideStage !== stageData.stage) {
    const stageMeta = STAGE_THRESHOLDS.find((s) => s.stage === overrideStage) ?? STAGE_THRESHOLDS[0]
    const isMax = overrideStage >= 4 || stageMeta.maxXp === null
    const span = stageMeta.maxXp !== null ? stageMeta.maxXp - stageMeta.minXp : 0
    const intoStage = Math.max(0, safeXp - stageMeta.minXp)
    return {
      xp: safeXp,
      stage: overrideStage,
      stageTitle: stageMeta.title,
      stageCode: stageMeta.stageCode,
      currentStageMinXp: stageMeta.minXp,
      nextStageMinXp: stageMeta.maxXp,
      xpIntoStage: isMax ? 0 : Math.min(intoStage, span),
      xpNeededForNextStage: isMax ? 0 : span,
      progressRatio: isMax ? 1 : span > 0 ? Math.min(1, intoStage / span) : 0,
      isMaxStage: isMax,
      subStage,
    }
  }

  return {
    xp: safeXp,
    ...stageData,
    subStage,
  }
}

/**
 * Returns any bonus XP earned when reaching a specific streak day count.
 */
export function getStreakMilestoneBonus(streakDays: number): number {
  const milestone = XP_CONFIG.streakMilestones.find((m) => m.days === streakDays)
  return milestone?.bonusXp ?? 0
}

/**
 * Computes XP in-memory from history and active tasks (used for guests and offline fallbacks).
 */
export function calculateXpFromHistory(
  history: Array<{ date: string; completedCount: number }>,
  currentDate: string,
  currentTasks: Array<{ completed: boolean }>
): number {
  let totalXp = 0
  const historyWithoutToday = history.filter((h) => h.date !== currentDate)

  // Past completions
  for (const day of historyWithoutToday) {
    const count = Math.min(day.completedCount, TOTAL_ALIGNMENT_TASKS)
    totalXp += count * XP_CONFIG.taskCompletionXp
    if (count === TOTAL_ALIGNMENT_TASKS) {
      totalXp += XP_CONFIG.allTasksDailyBonusXp
    }
  }

  // Today's completions
  const todayCount = currentTasks.filter((t) => t.completed).length
  totalXp += todayCount * XP_CONFIG.taskCompletionXp
  if (todayCount === TOTAL_ALIGNMENT_TASKS) {
    totalXp += XP_CONFIG.allTasksDailyBonusXp
  }

  return totalXp
}
