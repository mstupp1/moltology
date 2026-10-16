import 'dotenv/config'
import fs from 'node:fs'
import { runSimulationBatch, buildTickSchedule, DAILY_TICKS, WEEKLY_TICKS } from './lib/simulation-batch'
import {
  runSimulationCycle,
  prepareSimulationPlan,
  applySimulationPlan,
} from '../src/lib/server/simulation-engine'
import {
  applySimulationBatchPlan,
  isBatchPlan,
  listBatchTasks,
  prepareSimulationBatchPlan,
  resolveWeeklyWaveSchedule,
} from '../src/lib/server/simulation-batch-plan'

const DEFAULT_WEEKLY_PLAN_PATH = 'tmp/simulation-week-plan.json'

async function main() {
  const args = process.argv.slice(2)
  const daily = args.includes('--daily')
  const weekly = args.includes('--weekly')
  const noSpread = args.includes('--no-spread')
  const dryRun = args.includes('--dry-run')
  const forceSpawn = args.includes('--force-spawn')
  const spawnOnly = args.includes('--spawn-only')
  const routinesOnly = args.includes('--routines-only')
  const blogOnly = args.includes('--blog-only')
  const forumOnly = args.includes('--forum-only')
  const votesOnly = args.includes('--votes-only')
  const mutationsOnly = args.includes('--mutations-only')
  const socialOnly = args.includes('--social-only')
  const reviewOnly = args.includes('--review-only')

  const waveIdx = args.indexOf('--wave')
  const wave = waveIdx !== -1 ? Number(args[waveIdx + 1]) : 1

  const defaultPlanPath = weekly ? DEFAULT_WEEKLY_PLAN_PATH : 'tmp/simulation-plan.json'

  const prepareIdx = args.indexOf('--prepare')
  const isPrepare = prepareIdx !== -1
  const preparePath =
    isPrepare && args[prepareIdx + 1] && !args[prepareIdx + 1].startsWith('--')
      ? args[prepareIdx + 1]
      : defaultPlanPath

  const applyIdx = args.indexOf('--apply')
  const isApply = applyIdx !== -1
  const applyPath =
    isApply && args[applyIdx + 1] && !args[applyIdx + 1].startsWith('--')
      ? args[applyIdx + 1]
      : defaultPlanPath

  try {
    if (daily && (isPrepare || isApply)) {
      throw new Error('--daily is for autonomous execution. For in-prompt generation, prepare, generate, and apply each tick sequentially, or use --weekly with --prepare/--apply for a batched week.')
    }
    if (daily && weekly) {
      throw new Error('Use either --daily or --weekly, not both.')
    }
    if (isPrepare && weekly) {
      const schedule = resolveWeeklyWaveSchedule({ wave })
      console.log(`[SIMULATE] Preparing weekly batch plan (wave ${wave}, ${schedule.length} ticks)...`)
      const batch = await prepareSimulationBatchPlan({
        dryRun,
        forceSpawn,
        spawnOnly,
        routinesOnly,
        blogOnly,
        forumOnly,
        votesOnly,
        mutationsOnly,
        socialOnly,
        reviewOnly,
        schedule,
        wave,
        outPath: preparePath,
      })
      const taskCount = listBatchTasks(batch).length
      console.log(`[SIMULATE] ✓ Batch plan saved to: ${preparePath}`)
      console.log(`[SIMULATE] Ticks: ${batch.ticks.length} (${batch.ticks[0]?.at} → ${batch.ticks[batch.ticks.length - 1]?.at})`)
      console.log(`[SIMULATE] Tasks requiring generation across all ticks: ${taskCount}`)
      if (taskCount === 0) {
        console.log(`[SIMULATE] (No AI text generation needed. You can run --apply directly.)`)
      }
      process.exit(0)
    }
    if (isPrepare) {
      console.log(`[SIMULATE] Preparing simulation plan for in-prompt generation...`)
      const plan = await prepareSimulationPlan({
        dryRun,
        forceSpawn,
        spawnOnly,
        routinesOnly,
        blogOnly,
        forumOnly,
        votesOnly,
        mutationsOnly,
        socialOnly,
        reviewOnly,
        outPath: preparePath,
      })
      console.log(`[SIMULATE] ✓ Simulation plan saved to: ${preparePath}`)
      console.log(`[SIMULATE] Tasks requiring generation: ${plan.tasks.length}`)
      if (plan.tasks.length === 0) {
        console.log(`[SIMULATE] (No AI text generation needed this tick. You can run --apply directly.)`)
      }
      process.exit(0)
    }

    if (isApply) {
      console.log(`[SIMULATE] Applying simulation plan from: ${applyPath}...`)
      const parsed = fs.existsSync(applyPath) ? JSON.parse(fs.readFileSync(applyPath, 'utf8')) : null
      const results = isBatchPlan(parsed)
        ? await applySimulationBatchPlan(applyPath, { dryRun })
        : await applySimulationPlan(applyPath, { dryRun })
      console.log('[SIMULATE] Result summary:', JSON.stringify(results, null, 2))
      process.exit(0)
    }

    // Default: Option 1 end-to-end execution via AI Gateway
    const runTick = (at?: Date) => runSimulationCycle({
      dryRun,
      forceSpawn,
      spawnOnly,
      routinesOnly,
      blogOnly,
      forumOnly,
      votesOnly,
      mutationsOnly,
      socialOnly,
      reviewOnly,
      at,
    })
    const results = weekly
      ? await runSimulationBatch(
          runTick,
          WEEKLY_TICKS,
          noSpread ? undefined : buildTickSchedule({ days: 7, totalTicks: WEEKLY_TICKS })
        )
      : daily
        ? await runSimulationBatch(runTick, DAILY_TICKS)
        : await runTick()
    console.log('[SIMULATE] Result summary:', JSON.stringify(results, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('[SIMULATE] ❌ Simulation failed:', err)
    process.exit(1)
  }
}

main()
