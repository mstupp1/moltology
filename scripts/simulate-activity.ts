import 'dotenv/config'
import { runSimulationCycle } from '../src/lib/server/simulation-engine'

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const forceSpawn = args.includes('--force-spawn')
  const spawnOnly = args.includes('--spawn-only')
  const routinesOnly = args.includes('--routines-only')
  const forumOnly = args.includes('--forum-only')
  const votesOnly = args.includes('--votes-only')

  try {
    const results = await runSimulationCycle({
      dryRun,
      forceSpawn,
      spawnOnly,
      routinesOnly,
      forumOnly,
      votesOnly,
    })
    console.log('[SIMULATE] Result summary:', JSON.stringify(results, null, 2))
    process.exit(0)
  } catch (err) {
    console.error('[SIMULATE] ❌ Simulation failed:', err)
    process.exit(1)
  }
}

main()
