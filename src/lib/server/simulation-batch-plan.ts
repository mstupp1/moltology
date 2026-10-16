import fs from 'node:fs'
import path from 'node:path'
import {
  DEFAULT_GROWTH_CONFIG,
  applySimulationPlan,
  prepareSimulationPlan,
  type PrepareSimulationPlanOptions,
  type SimulationPlan,
  type SimulationPlanForumReplyTask,
  type SimulationPlanTask,
} from './simulation-engine'
import { WEEKLY_TICKS, buildTickSchedule } from '../simulation-schedule'

/**
 * A weekly simulation is generated in two waves so replies can answer threads that
 * already exist: wave 1 covers the first half of the week, wave 2 (prepared after
 * wave 1 is applied) covers the second half and can reply to wave 1's topics.
 */
export const WEEKLY_WAVES = 2
export const TICKS_PER_WAVE = WEEKLY_TICKS / WEEKLY_WAVES
export const DEFAULT_WEEK_SCHEDULE_PATH = 'tmp/simulation-week-schedule.json'

export interface SimulationBatchTick {
  index: number
  /** Simulated moment this tick is stamped with (ISO). */
  at: string
  /** Set once the tick has been committed so a re-run never repeats it. */
  applied?: boolean
  plan: SimulationPlan
}

export interface SimulationBatchPlan {
  version: 1
  kind: 'batch'
  createdAt: string
  wave: number
  ticks: SimulationBatchTick[]
}

type PrepareOptions = Pick<
  PrepareSimulationPlanOptions,
  | 'dryRun'
  | 'forceSpawn'
  | 'spawnOnly'
  | 'routinesOnly'
  | 'blogOnly'
  | 'forumOnly'
  | 'votesOnly'
  | 'mutationsOnly'
  | 'socialOnly'
  | 'reviewOnly'
>

export function isBatchPlan(value: unknown): value is SimulationBatchPlan {
  return Boolean(value && typeof value === 'object' && (value as { kind?: unknown }).kind === 'batch')
}

/** All generated-text tasks across every tick of a batch plan. */
export function listBatchTasks(plan: SimulationBatchPlan): SimulationPlanTask[] {
  return plan.ticks.flatMap((tick) => tick.plan.tasks)
}

/**
 * Drop plan tasks that repeat across ticks. Every tick is planned against the same
 * database snapshot, so without this two ticks could have the same member reply to the
 * same post, and a burst of spawns could overshoot the population cap.
 */
export function dedupeBatchTasks(
  tickTasks: SimulationPlanTask[][],
  spawnCapacity: number
): SimulationPlanTask[][] {
  const seenReplies = new Set<string>()
  let spawnsLeft = Math.max(0, spawnCapacity)
  return tickTasks.map((tasks, tickIndex) =>
    tasks
      .filter((task) => {
        if (task.kind === 'spawn_persona') {
          if (spawnsLeft <= 0) return false
          spawnsLeft -= 1
          return true
        }
        if (task.kind === 'blog_comment') {
          const key = `blog|${task.authorId}|${task.postId}`
          if (seenReplies.has(key)) return false
          seenReplies.add(key)
        }
        if (task.kind === 'forum_reply') {
          const reply = task as SimulationPlanForumReplyTask
          const key = `${reply.authorId}|${reply.targetPostId ?? reply.topicId}`
          if (seenReplies.has(key)) return false
          seenReplies.add(key)
        }
        return true
      })
      .map((task) => ({ ...task, id: `t${tickIndex + 1}-${task.id}` }))
  )
}

/** Plan several ticks against the current database state. No LLM calls are made. */
export async function prepareSimulationBatchPlan(
  options: PrepareOptions & {
    schedule: Date[]
    wave: number
    outPath?: string
  }
): Promise<SimulationBatchPlan> {
  const { schedule, wave, outPath, ...prepareOptions } = options
  const plans: SimulationPlan[] = []
  for (let i = 0; i < schedule.length; i++) {
    plans.push(await prepareSimulationPlan({ ...prepareOptions, at: schedule[i] }))
  }

  const memberCount = plans[0]?.meta.simulatedMemberCount ?? 0
  const deduped = dedupeBatchTasks(
    plans.map((plan) => plan.tasks),
    DEFAULT_GROWTH_CONFIG.maxSimulatedUsers - memberCount
  )

  const batch: SimulationBatchPlan = {
    version: 1,
    kind: 'batch',
    createdAt: new Date().toISOString(),
    wave,
    ticks: plans.map((plan, i) => ({
      index: i + 1,
      at: schedule[i].toISOString(),
      plan: {
        ...plan,
        tasks: deduped[i],
        meta: { ...plan.meta, tasksCount: deduped[i].length },
      },
    })),
  }

  if (outPath) {
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(batch, null, 2), 'utf8')
  }
  return batch
}

/**
 * Apply every tick of a generated batch plan in order, each stamped with its own
 * simulated time. Missing generated text anywhere fails before anything is written.
 * Progress is saved after each tick so a re-run skips ticks that already committed.
 */
export async function applySimulationBatchPlan(
  planOrPath: SimulationBatchPlan | string,
  options: { dryRun?: boolean } = {}
) {
  const planPath = typeof planOrPath === 'string' ? planOrPath : null
  const plan: SimulationBatchPlan =
    typeof planOrPath === 'string' ? JSON.parse(fs.readFileSync(planOrPath, 'utf8')) : planOrPath
  if (!isBatchPlan(plan)) {
    throw new Error('[SimulationBatch] Not a batch plan. Use --apply without --batch for single-tick plans.')
  }

  for (const task of listBatchTasks(plan)) {
    if (!task.generated) {
      throw new Error(`[SimulationBatch] Task "${task.id}" (${task.kind}) has no generated text. Nothing was applied.`)
    }
  }

  const results: unknown[] = []
  for (const tick of plan.ticks) {
    if (tick.applied) {
      console.log(`[SimulationBatch] Tick ${tick.index}/${plan.ticks.length} already applied, skipping.`)
      continue
    }
    console.log(`[SimulationBatch] Applying tick ${tick.index}/${plan.ticks.length} at ${tick.at}`)
    try {
      results.push({
        index: tick.index,
        at: tick.at,
        result: await applySimulationPlan(tick.plan, { dryRun: options.dryRun, at: new Date(tick.at) }),
      })
    } catch (err) {
      throw new Error(
        `[SimulationBatch] Tick ${tick.index} failed. Earlier ticks are committed and marked applied; do not retry them. ${err instanceof Error ? err.message : String(err)}`
      )
    }
    if (!options.dryRun && planPath) {
      tick.applied = true
      fs.writeFileSync(planPath, JSON.stringify(plan, null, 2), 'utf8')
    }
  }
  return { wave: plan.wave, ticks: results }
}

/**
 * Wave 1 builds the schedule for the whole week and saves it; wave 2 reuses it so the
 * two waves line up. Returns this wave's slice.
 */
export function resolveWeeklyWaveSchedule(options: {
  wave: number
  schedulePath?: string
  now?: Date
}): Date[] {
  const schedulePath = options.schedulePath ?? DEFAULT_WEEK_SCHEDULE_PATH
  if (options.wave < 1 || options.wave > WEEKLY_WAVES) {
    throw new Error(`[SimulationBatch] --wave must be between 1 and ${WEEKLY_WAVES}.`)
  }

  let full: Date[]
  if (options.wave === 1) {
    full = buildTickSchedule({ now: options.now, days: 7, totalTicks: WEEKLY_TICKS })
    fs.mkdirSync(path.dirname(schedulePath), { recursive: true })
    fs.writeFileSync(
      schedulePath,
      JSON.stringify({ createdAt: new Date().toISOString(), schedule: full.map((d) => d.toISOString()) }, null, 2),
      'utf8'
    )
  } else {
    if (!fs.existsSync(schedulePath)) {
      throw new Error(`[SimulationBatch] No saved schedule at ${schedulePath}. Prepare and apply wave 1 first.`)
    }
    const saved = JSON.parse(fs.readFileSync(schedulePath, 'utf8')) as { schedule: string[] }
    full = saved.schedule.map((iso) => new Date(iso))
  }

  const start = (options.wave - 1) * TICKS_PER_WAVE
  return full.slice(start, start + TICKS_PER_WAVE)
}
