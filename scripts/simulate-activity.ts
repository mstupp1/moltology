import 'dotenv/config'
import {
  runSimulationCycle,
  prepareSimulationPlan,
  applySimulationPlan,
} from '../src/lib/server/simulation-engine'

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const forceSpawn = args.includes('--force-spawn')
  const spawnOnly = args.includes('--spawn-only')
  const routinesOnly = args.includes('--routines-only')
  const forumOnly = args.includes('--forum-only')
  const votesOnly = args.includes('--votes-only')
  const mutationsOnly = args.includes('--mutations-only')
  const socialOnly = args.includes('--social-only')
  const reviewOnly = args.includes('--review-only')

  const prepareIdx = args.indexOf('--prepare')
  const isPrepare = prepareIdx !== -1
  const preparePath =
    isPrepare && args[prepareIdx + 1] && !args[prepareIdx + 1].startsWith('--')
      ? args[prepareIdx + 1]
      : 'tmp/simulation-plan.json'

  const applyIdx = args.indexOf('--apply')
  const isApply = applyIdx !== -1
  const applyPath =
    isApply && args[applyIdx + 1] && !args[applyIdx + 1].startsWith('--')
      ? args[applyIdx + 1]
      : 'tmp/simulation-plan.json'

  try {
    if (isPrepare) {
      console.log(`[SIMULATE] Preparing simulation plan for in-prompt generation...`)
      const plan = await prepareSimulationPlan({
        dryRun,
        forceSpawn,
        spawnOnly,
        routinesOnly,
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
      const results = await applySimulationPlan(applyPath, {
        dryRun,
      })
      console.log('[SIMULATE] Result summary:', JSON.stringify(results, null, 2))
      process.exit(0)
    }

    // Default: Option 1 end-to-end execution via AI Gateway
    const results = await runSimulationCycle({
      dryRun,
      forceSpawn,
      spawnOnly,
      routinesOnly,
      forumOnly,
      votesOnly,
      mutationsOnly,
      socialOnly,
      reviewOnly,
    })
    console.log('[SIMULATE] Result summary:', JSON.stringify(results, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('[SIMULATE] ❌ Simulation failed:', err)
    process.exit(1)
  }
}

main()
