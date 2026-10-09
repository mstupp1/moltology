import { CANONICAL_SCRIPTURES, STAGE_PIPELINE_DATA, type StagePipelineInfo, type SubStageInfo } from './codexData'
import { scriptureSlugFromId } from './codex-links'
import { TOTAL_ALIGNMENT_TASKS } from './alignment-tasks'
import { STAGE_THRESHOLDS, SUB_STAGE_THRESHOLDS, XP_CONFIG } from './progression'

/** Deepest reading in the pipeline: the Challenger Deep, in meters. */
export const MAX_DEPTH_M = 10928

export interface Clearance {
  index: number
  code: string
  stageNum: number
  stage: StagePipelineInfo
  sub: SubStageInfo
  /** Lifetime XP at which this clearance opens (from SUB_STAGE_THRESHOLDS). */
  minXp: number
  /** XP at which the next clearance opens, or null for the last one. */
  nextMinXp: number | null
  depthFromM: number
  depthToM: number
  /** Upper end of the typical Pincer Torque reading, in Nm. */
  torqueNm: number
  /** Codex slug for the parent stage scripture, when one exists. */
  scriptureSlug: string | null
}

export type ClearanceStatus = 'cleared' | 'current' | 'ahead'

/** Pulls the numbers out of a reading such as "1,200 - 1,500 meters" or "1,200 Nm, held". */
export function parseReadingRange(reading: string): [number, number] {
  const numbers = (reading.replace(/,/g, '').match(/\d+(?:\.\d+)?/g) ?? []).map(Number)
  if (numbers.length === 0) return [0, 0]
  return [numbers[0], numbers[numbers.length - 1]]
}

function stageScriptureSlug(stage: StagePipelineInfo): string | null {
  const wanted = stage.stageTitle.toLowerCase()
  const scripture = CANONICAL_SCRIPTURES.find((item) => item.title.toLowerCase() === wanted)
  return scripture ? scriptureSlugFromId(scripture.id) : null
}

export const PIPELINE_CLEARANCES: Clearance[] = STAGE_PIPELINE_DATA.flatMap((stage) => {
  const scriptureSlug = stageScriptureSlug(stage)
  return stage.subStages.map((sub) => ({ stage, sub, scriptureSlug }))
}).map(({ stage, sub, scriptureSlug }, index, all) => {
  const threshold = SUB_STAGE_THRESHOLDS.find((t) => t.code === sub.code)
  const next = all[index + 1] ? SUB_STAGE_THRESHOLDS.find((t) => t.code === all[index + 1].sub.code) : undefined
  const [depthFromM, depthToM] = parseReadingRange(sub.submergenceDepth)
  return {
    index,
    code: sub.code,
    stageNum: stage.stageNum,
    stage,
    sub,
    minXp: threshold?.minXp ?? 0,
    nextMinXp: next?.minXp ?? null,
    depthFromM,
    depthToM: Math.max(depthFromM, depthToM),
    torqueNm: parseReadingRange(sub.pincerTorqueTarget)[1],
    scriptureSlug,
  }
})

export const MAX_TORQUE_NM = Math.max(...PIPELINE_CLEARANCES.map((c) => c.torqueNm))

export function stageXpRange(stageNum: number): { minXp: number; maxXp: number | null } {
  const stage = STAGE_THRESHOLDS.find((s) => s.stage === stageNum) ?? STAGE_THRESHOLDS[0]
  return { minXp: stage.minXp, maxXp: stage.maxXp }
}

/** Index of the clearance a member holds at this lifetime XP. */
export function clearanceIndexForXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp || 0))
  let found = 0
  for (const clearance of PIPELINE_CLEARANCES) {
    if (safeXp >= clearance.minXp) found = clearance.index
  }
  return found
}

export function clearanceStatus(index: number, xp: number): ClearanceStatus {
  const current = clearanceIndexForXp(xp)
  if (index < current) return 'cleared'
  if (index === current) return 'current'
  return 'ahead'
}

/**
 * Where the member sits along the twelve evenly spaced clearances, as a fractional index.
 * 2.5 means halfway from the third clearance to the fourth.
 */
export function xpTrackPosition(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp || 0))
  const index = clearanceIndexForXp(safeXp)
  const clearance = PIPELINE_CLEARANCES[index]
  if (clearance.nextMinXp === null) return index
  const span = clearance.nextMinXp - clearance.minXp
  return index + Math.min(1, Math.max(0, (safeXp - clearance.minXp) / span))
}

/** XP a member earns in a day for this many liturgies, before streak milestones. */
export function dailyLiturgyXp(liturgiesPerDay: number): number {
  const count = Math.max(0, Math.min(TOTAL_ALIGNMENT_TASKS, Math.floor(liturgiesPerDay)))
  const allBonus = count === TOTAL_ALIGNMENT_TASKS ? XP_CONFIG.allTasksDailyBonusXp : 0
  return count * XP_CONFIG.taskCompletionXp + allBonus
}

/** Longest projection we bother to run: ten years of days. */
export const PROJECTION_HORIZON_DAYS = 3650

/**
 * Days until each target XP is reached, keeping a steady number of liturgies a day from
 * tomorrow on. Streak milestones only pay out on unbroken full days, so they count only when
 * every liturgy is done. A target already reached returns 0; one past the horizon returns null.
 */
export function projectDaysToTargets(fromXp: number, liturgiesPerDay: number, targets: number[]): Array<number | null> {
  const startXp = Math.max(0, Math.floor(fromXp || 0))
  const daily = dailyLiturgyXp(liturgiesPerDay)
  const fullDays = Math.floor(liturgiesPerDay) >= TOTAL_ALIGNMENT_TASKS
  const results: Array<number | null> = targets.map((target) => (startXp >= target ? 0 : null))
  if (daily <= 0) return results

  let xp = startXp
  let pending = results.filter((r) => r === null).length
  for (let day = 1; day <= PROJECTION_HORIZON_DAYS && pending > 0; day++) {
    xp += daily
    if (fullDays) {
      xp += XP_CONFIG.streakMilestones.find((m) => m.days === day)?.bonusXp ?? 0
    }
    targets.forEach((target, i) => {
      if (results[i] === null && xp >= target) {
        results[i] = day
        pending--
      }
    })
  }
  return results
}

/** Plain English length for a projected number of days. */
export function formatDayCount(days: number | null): string {
  if (days === null) return 'over ten years'
  if (days === 0) return 'reached'
  if (days === 1) return '1 day'
  if (days < 60) return `${days} days`
  if (days < 730) return `about ${Math.round(days / 30.4)} months`
  const years = Math.round((days / 365) * 10) / 10
  return `about ${years} years`
}

export function formatMeters(meters: number): string {
  return `${meters.toLocaleString('en-US')} m`
}
