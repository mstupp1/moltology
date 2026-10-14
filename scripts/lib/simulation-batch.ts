/** Run sequentially so each tick sees the preceding tick's committed activity. */
export async function runSimulationBatch<T>(runTick: () => Promise<T>) {
  const ticks: T[] = []
  for (let tick = 1; tick <= 2; tick++) {
    console.log(`[SIMULATE] Daily batch: starting tick ${tick}/2`)
    // Stop on failure: ticks can partially commit and must not be blindly retried.
    const result = await runTick()
    ticks.push(result)
    console.log(`[SIMULATE] Tick ${tick} result:`, JSON.stringify(result, null, 2))
    if (result && typeof result === 'object' && 'skipped' in result && result.skipped) break
  }
  return { ticks }
}
