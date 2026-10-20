import { CANONICAL_SCRIPTURES, STAGE_PIPELINE_DATA, type StagePipelineInfo, type SubStageInfo } from './codexData'
import { scriptureSlugFromId } from './codex-links'
import { STAGE_THRESHOLDS, SUB_STAGE_THRESHOLDS } from './progression'

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
    scriptureSlug,
  }
})

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

/** How far the member is through their current clearance, or null at the last one. */
export function nextClearanceProgress(xp: number): { next: Clearance; remainingXp: number; percent: number } | null {
  const safeXp = Math.max(0, Math.floor(xp || 0))
  const current = PIPELINE_CLEARANCES[clearanceIndexForXp(safeXp)]
  const next = PIPELINE_CLEARANCES[current.index + 1]
  if (!next || current.nextMinXp === null) return null
  const span = current.nextMinXp - current.minXp
  const into = Math.min(span, safeXp - current.minXp)
  return { next, remainingXp: current.nextMinXp - safeXp, percent: Math.round((into / span) * 100) }
}
