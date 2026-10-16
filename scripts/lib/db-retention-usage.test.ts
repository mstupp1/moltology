import { describe, expect, it, vi } from 'vitest'
import {
  USAGE_RETENTION_BATCH_SIZE,
  USAGE_RETENTION_MAX_BATCHES,
  applyUsageRetention,
  countUsageRetentionCandidates,
  getUsageRetentionCutoffs,
} from './db-retention-usage'
import type { RetentionQuery } from './db-retention-cleanup'

function mockQuery(responses: Array<Array<Record<string, unknown>>> = []) {
  const calls: Array<{ sql: string; values: unknown[] }> = []
  const query = vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ sql: strings.join('?'), values })
    return responses.shift() ?? []
  }) as unknown as RetentionQuery
  return { query, calls }
}

describe('AI usage retention cutoffs', () => {
  it('uses each profile window and UTC calendar dates for summary expiry', () => {
    const asOf = new Date('2026-10-15T12:00:00.000Z')
    expect(getUsageRetentionCutoffs(asOf, 'lean')).toEqual({
      rawEvents: new Date('2026-09-15T12:00:00.000Z'),
      dailySummaries: '2025-09-10',
    })
    expect(getUsageRetentionCutoffs(asOf, 'lenient')).toEqual({
      rawEvents: new Date('2026-07-17T12:00:00.000Z'),
      dailySummaries: '2023-10-16',
    })
  })

  it('counts raw events to compact and daily summaries to expire', async () => {
    const { query, calls } = mockQuery([[{ count: '12' }], [{ count: 3 }]])
    const asOf = new Date('2026-10-15T12:00:00.000Z')
    await expect(countUsageRetentionCandidates(query, asOf, 'lean')).resolves.toEqual({
      rawEventsToCompact: 12,
      dailySummariesToExpire: 3,
    })
    expect(calls).toHaveLength(2)
    expect(calls[0].sql).toContain('FROM ai_usage_events')
    expect(calls[0].values[0]).toBe('2026-09-15T12:00:00.000Z')
    expect(calls[1].sql).toContain('FROM ai_usage_daily_summaries')
    expect(calls[1].values[0]).toBe('2025-09-10')
  })
})

describe('AI usage compaction', () => {
  it('moves bounded batches into additive daily summaries in the same statement as deletion', async () => {
    const { query, calls } = mockQuery([
      [{ deleted: 2, touched_summary_keys: 2 }],
      [{ deleted: 1, touched_summary_keys: 1 }],
      [{ deleted: 0 }],
    ])
    const result = await applyUsageRetention(query, new Date('2026-10-15T12:00:00.000Z'), 'lean', {
      batchSize: 2,
      maxBatches: 3,
    })

    expect(result).toEqual({
      compactedEvents: 3,
      touchedSummaryKeys: 3,
      expiredDailySummaries: 0,
      compactionCapped: false,
      summaryExpiryCapped: false,
      capped: false,
    })
    expect(calls).toHaveLength(3)
    const sql = calls[0].sql
    expect(sql).toContain('WITH batch AS MATERIALIZED')
    expect(sql).toContain('DELETE FROM ai_usage_events e')
    expect(sql).toContain('INSERT INTO ai_usage_daily_summaries')
    expect(sql).toContain('ON CONFLICT ("userId", "date", kind, model) DO UPDATE')
    expect(sql).toContain('COALESCE(e.model, \'\') AS model')
    expect(sql).toContain("'timestamp with time zone'::regtype")
    expect(sql).toContain("AT TIME ZONE 'UTC'")
    expect(sql).toContain("to_char(utc_day, 'YYYY-MM-DD')")
    expect(sql).toContain('COUNT(*) FILTER (WHERE "inputTokens" IS NULL)')
    expect(sql).toContain('COUNT(*) FILTER (WHERE "outputTokens" IS NULL)')
    expect(sql).toContain('"requestCount" = ai_usage_daily_summaries."requestCount" + EXCLUDED."requestCount"')
    expect(sql).toContain('"inputTokens" = ai_usage_daily_summaries."inputTokens" + EXCLUDED."inputTokens"')
    expect(sql).toContain('FOR UPDATE SKIP LOCKED')
    expect(calls[0].values).toEqual(['2026-09-15T12:00:00.000Z', 2])
    expect(calls[2].sql).toContain('DELETE FROM ai_usage_daily_summaries s')
    expect(calls[2].values).toEqual(['2025-09-10', 2])
  })

  it('caps compaction and summary expiry independently at the configured batch bound', async () => {
    const { query } = mockQuery([
      [{ deleted: 1, touched_summary_keys: 1 }],
      [{ deleted: 1 }],
    ])
    const result = await applyUsageRetention(query, new Date('2026-10-15T12:00:00.000Z'), 'lean', {
      batchSize: 1,
      maxBatches: 1,
    })
    expect(result.compactionCapped).toBe(true)
    expect(result.summaryExpiryCapped).toBe(true)
    expect(result.capped).toBe(true)
    expect(USAGE_RETENTION_BATCH_SIZE).toBe(500)
    expect(USAGE_RETENTION_MAX_BATCHES).toBe(20)
  })

  it('does not allow callers to raise the built-in batch ceilings', async () => {
    const { query } = mockQuery()
    await expect(applyUsageRetention(query, new Date(), 'lean', { batchSize: USAGE_RETENTION_BATCH_SIZE + 1 })).rejects.toThrow('batchSize cannot exceed')
    await expect(applyUsageRetention(query, new Date(), 'lean', { maxBatches: USAGE_RETENTION_MAX_BATCHES + 1 })).rejects.toThrow('maxBatches cannot exceed')
  })

  it('reports committed compaction batches before a later query fails', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce([{ deleted: 1, touched_summary_keys: 1 }])
      .mockRejectedValueOnce(new Error('summary expiry failed')) as unknown as RetentionQuery
    const onBatch = vi.fn()

    await expect(applyUsageRetention(query, new Date('2026-10-15T12:00:00.000Z'), 'lean', { batchSize: 2, onBatch }))
      .rejects.toThrow('summary expiry failed')
    expect(onBatch).toHaveBeenCalledTimes(1)
    expect(onBatch).toHaveBeenCalledWith({
      phase: 'compactedEvents',
      batch: 1,
      counts: { compactedEvents: 1, touchedSummaryKeys: 1 },
    })
  })
})

