import { describe, expect, it, vi } from 'vitest'
import { runSimulationBatch } from './simulation-batch'

describe('daily simulation batch', () => {
  it('runs two sequential ticks and retains both summaries', async () => {
    let committed = 0
    const runTick = vi.fn(async () => {
      const previous = committed
      await Promise.resolve()
      committed = previous + 1
      return { committed }
    })
    expect(await runSimulationBatch(runTick)).toEqual({ ticks: [{ committed: 1 }, { committed: 2 }] })
    expect(runTick).toHaveBeenCalledTimes(2)
  })

  it('stops without retrying a failed tick', async () => {
    const runTick = vi.fn().mockRejectedValue(new Error('partial write'))
    await expect(runSimulationBatch(runTick)).rejects.toThrow('partial write')
    expect(runTick).toHaveBeenCalledTimes(1)
  })

  it('does not repeat the first tick when the second fails', async () => {
    const runTick = vi.fn().mockResolvedValueOnce({ topicId: 'committed' }).mockRejectedValueOnce(new Error('failed'))
    await expect(runSimulationBatch(runTick)).rejects.toThrow('failed')
    expect(runTick).toHaveBeenCalledTimes(2)
  })

  it('stops when simulation is disabled', async () => {
    const runTick = vi.fn().mockResolvedValue({ skipped: true })
    expect(await runSimulationBatch(runTick)).toEqual({ ticks: [{ skipped: true }] })
    expect(runTick).toHaveBeenCalledTimes(1)
  })
})
