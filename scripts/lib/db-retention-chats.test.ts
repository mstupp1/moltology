import { describe, expect, it, vi } from 'vitest'
import {
  CHAT_RETENTION_BATCH_SIZE,
  CHAT_RETENTION_MAX_BATCHES,
  applyChatRetention,
  countChatRetentionCandidates,
  getChatRetentionCutoff,
} from './db-retention-chats'
import type { RetentionQuery } from './db-retention-cleanup'

function mockQuery(responses: Array<Array<Record<string, unknown>>> = []) {
  const calls: Array<{ sql: string; values: unknown[] }> = []
  const query = vi.fn(async (strings: TemplateStringsArray, ...values: unknown[]) => {
    calls.push({ sql: strings.join('?'), values })
    return responses.shift() ?? []
  }) as unknown as RetentionQuery
  return { query, calls }
}

describe('archived chat retention', () => {
  it('expires from archivedAt exactly 30 days after archive, independent of thread activity', () => {
    expect(getChatRetentionCutoff(new Date('2026-10-15T12:00:00.000Z')))
      .toEqual(new Date('2026-09-15T12:00:00.000Z'))
  })

  it('previews only archived threads, including archived pinned threads', async () => {
    const { query, calls } = mockQuery([[{ count: '7' }]])
    await expect(countChatRetentionCandidates(query, new Date('2026-10-15T12:00:00.000Z'))).resolves.toBe(7)
    expect(calls).toHaveLength(1)
    expect(calls[0].sql).toContain('FROM ai_threads')
    expect(calls[0].sql).toContain('"archivedAt" IS NOT NULL')
    expect(calls[0].sql).toContain('"archivedAt" <= ?')
    expect(calls[0].sql).not.toContain('"updatedAt"')
    expect(calls[0].sql).not.toContain('"pinnedAt"')
    expect(calls[0].values).toEqual(['2026-09-15T12:00:00.000Z'])
  })

  it('deletes eligible archived threads in bounded batches and rechecks archive eligibility', async () => {
    const { query, calls } = mockQuery([
      [{ deleted: 2, batch_count: 2 }],
      [{ deleted: 1, batch_count: 1 }],
    ])
    const onBatch = vi.fn()
    await expect(applyChatRetention(query, new Date('2026-10-15T12:00:00.000Z'), {
      batchSize: 2,
      maxBatches: 3,
      onBatch,
    })).resolves.toEqual({ selectedThreads: 3, deletedThreads: 3, capped: false })
    expect(onBatch).toHaveBeenNthCalledWith(1, {
      phase: 'archivedThreads',
      batch: 1,
      counts: { selectedThreads: 2, deletedThreads: 2 },
    })
    expect(onBatch).toHaveBeenNthCalledWith(2, {
      phase: 'archivedThreads',
      batch: 2,
      counts: { selectedThreads: 1, deletedThreads: 1 },
    })
    expect(calls).toHaveLength(2)
    const sql = calls[0].sql
    expect(sql).toContain('WITH batch AS MATERIALIZED')
    expect(sql).toContain('FOR UPDATE SKIP LOCKED')
    expect(sql).toContain('DELETE FROM ai_threads t')
    expect(sql).toContain('t."archivedAt" IS NOT NULL')
    expect(sql).toContain('t."archivedAt" <= ?')
    expect(sql).not.toContain('t."pinnedAt"')
    expect(sql).not.toContain('t."updatedAt"')
    expect(calls[0].values).toEqual([
      '2026-09-15T12:00:00.000Z',
      2,
      '2026-09-15T12:00:00.000Z',
    ])
  })

  it('reports a full final batch as capped and enforces hard bounds', async () => {
    const { query } = mockQuery([[{ deleted: 1, batch_count: 1 }]])
    const result = await applyChatRetention(query, new Date('2026-10-15T12:00:00.000Z'), {
      batchSize: 1,
      maxBatches: 1,
    })
    expect(result.capped).toBe(true)
    expect(CHAT_RETENTION_BATCH_SIZE).toBe(500)
    expect(CHAT_RETENTION_MAX_BATCHES).toBe(20)
    await expect(applyChatRetention(query, new Date(), { batchSize: CHAT_RETENTION_BATCH_SIZE + 1 })).rejects.toThrow('batchSize')
    await expect(applyChatRetention(query, new Date(), { maxBatches: CHAT_RETENTION_MAX_BATCHES + 1 })).rejects.toThrow('maxBatches')
  })
})

