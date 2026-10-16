import { DAILY_TICKS, WEEKLY_TICKS, TICKS_PER_DAY, buildTickSchedule } from '../../src/lib/simulation-schedule'

export { DAILY_TICKS, WEEKLY_TICKS, TICKS_PER_DAY, buildTickSchedule }

/**
 * Run sequentially so each tick sees the preceding tick's committed activity.
 * When `schedule` is given, tick N is stamped with `schedule[N - 1]` (oldest first).
 */
export async function runSimulationBatch<T>(
  runTick: (at?: Date) => Promise<T>,
  totalTicks: number = DAILY_TICKS,
  schedule?: Date[]
) {
  const ticks: T[] = []
  for (let tick = 1; tick <= totalTicks; tick++) {
    const at = schedule?.[tick - 1]
    console.log(`[SIMULATE] Batch: starting tick ${tick}/${totalTicks}${at ? ` (simulated time ${at.toISOString()})` : ''}`)
    // Stop on failure: ticks can partially commit and must not be blindly retried.
    const result = await runTick(at)
    ticks.push(result)
    console.log(`[SIMULATE] Tick ${tick} result:`, JSON.stringify(result, null, 2))
    if (result && typeof result === 'object' && 'skipped' in result && result.skipped) break
  }
  return { ticks }
}
