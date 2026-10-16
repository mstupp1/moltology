import { describe, expect, it, vi } from 'vitest'
import {
  applyCompletionRetention,
  countCompletionRetentionCandidates,
  getCompletionRetentionCutoffs,
  type CompletionRetentionQuery,
} from './db-retention-completions'
import { ALIGNMENT_HISTORY_DAYS, shiftDays } from '../../src/lib/alignment-tasks'

const AS_OF = new Date('2026-10-15T12:00:00.000Z')

describe('completion retention', () => {
  it('keeps the 90-day visible window plus one UTC/local-date boundary day', () => {
    expect(getCompletionRetentionCutoffs(AS_OF, 'lean')).toEqual({
      raw: '2026-09-01',
      summaries: '2026-07-17',
    })
    expect(getCompletionRetentionCutoffs(AS_OF, 'lenient')).toEqual({
      raw: '2026-08-17',
      summaries: '2026-07-17',
    })
  })

  it('retains the oldest visible local date when UTC has crossed into the next day', () => {
    const asOf = new Date('2026-10-16T00:30:00.000Z')
    const targetDate = '2026-10-15'
    const oldestVisible = shiftDays(targetDate, -(ALIGNMENT_HISTORY_DAYS - 1))
    expect(oldestVisible).toBe('2026-07-18')
    expect(getCompletionRetentionCutoffs(asOf, 'lean').summaries).toBe(oldestVisible)
  })

  it('counts raw rows to summarize separately from rows and summaries outside the history window', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ rawRowsToExpire: 12, rawRowsToSummarize: 34 }])
      .mockResolvedValueOnce([{ count: 8 }]) as unknown as CompletionRetentionQuery

    await expect(countCompletionRetentionCandidates(query, AS_OF, 'lean')).resolves.toEqual({
      rawRowsToExpire: 12,
      rawRowsToSummarize: 34,
      summaryDaysToExpire: 8,
    })
    expect(query).toHaveBeenCalledTimes(2)
  })

  it('moves whole member/day groups atomically and unions task keys for late rows', async () => {
    const query = vi.fn().mockResolvedValue([{ changed: 0 }]) as unknown as CompletionRetentionQuery

    await applyCompletionRetention(query, AS_OF, 'lean', { batchSize: 2, maxBatches: 3 })

    const statements = vi.mocked(query).mock.calls.map(([strings]) => Array.from(strings).join(' '))
    expect(statements[0]).toContain('routine_streak_carries')
    expect(statements[0]).toContain('ROW_NUMBER() OVER')
    expect(statements[0]).toContain('ON CONFLICT ("userId") DO UPDATE')
    const compaction = statements.find((statement) => statement.includes('day_keys AS'))
    expect(compaction).toContain('GROUP BY c."userId", c."completedOn"')
    expect(compaction).toContain('RETURNING c."userId", c."completedOn", c."taskKey"')
    expect(compaction).toContain('routine_day_summaries."taskKeys" || EXCLUDED."taskKeys"')
    expect(compaction).toContain('ON CONFLICT ("userId", "completedOn") DO UPDATE')
    expect(compaction).not.toContain('ctid')
  })

  it('bounds batches and never truncates the configured batch limits', async () => {
    const query = vi.fn().mockResolvedValue([{ changed: 0 }]) as unknown as CompletionRetentionQuery

    await expect(
      applyCompletionRetention(query, AS_OF, 'lean', { batchSize: 251 }),
    ).rejects.toThrow('batchSize')
    expect(query).not.toHaveBeenCalled()
  })

  it('reports committed expiry batches before a later phase fails', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ changed: 1 }])
      .mockResolvedValueOnce([{ changed: 1, batch_count: 1 }])
      .mockRejectedValueOnce(new Error('summary compaction failed')) as unknown as CompletionRetentionQuery
    const onBatch = vi.fn()

    await expect(applyCompletionRetention(query, AS_OF, 'lean', { batchSize: 2, onBatch }))
      .rejects.toThrow('summary compaction failed')
    expect(onBatch).toHaveBeenCalledTimes(2)
    expect(onBatch).toHaveBeenNthCalledWith(2, {
      phase: 'rawRowsToExpire',
      batch: 1,
      counts: { rawRowsToExpire: 1, selectedGroups: 1 },
    })
  })
})
