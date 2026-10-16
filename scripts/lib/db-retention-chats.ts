import { cutoffDate } from '../../src/lib/data-retention'
import { CHAT_ARCHIVE_RETENTION_DAYS } from '../../src/lib/ai/chat-retention'
import {
  RETENTION_BATCH_SIZE,
  RETENTION_MAX_BATCHES,
  type RetentionProgressCallback,
  type RetentionQuery,
} from './db-retention-cleanup'

export const CHAT_RETENTION_BATCH_SIZE = RETENTION_BATCH_SIZE
export const CHAT_RETENTION_MAX_BATCHES = RETENTION_MAX_BATCHES

export type ChatRetentionCounts = {
  archivedThreadsToDelete: number
}

export function getChatRetentionCutoff(asOf: Date): Date {
  return cutoffDate(asOf, CHAT_ARCHIVE_RETENTION_DAYS)
}

function countFrom(rows: Array<Record<string, unknown>>): number {
  return Number(rows[0]?.count ?? rows[0]?.deleted ?? 0)
}

export async function countChatRetentionCandidates(
  query: RetentionQuery,
  asOf: Date,
): Promise<number> {
  const cutoff = getChatRetentionCutoff(asOf)
  const rows = await query`
    SELECT COUNT(*)::int AS count
    FROM ai_threads
    WHERE "archivedAt" IS NOT NULL
      AND "archivedAt" <= ${cutoff.toISOString()}
  `
  return countFrom(rows)
}

export async function applyChatRetention(
  query: RetentionQuery,
  asOf: Date,
  limits: { batchSize?: number; maxBatches?: number; onBatch?: RetentionProgressCallback } = {},
): Promise<{ selectedThreads: number; deletedThreads: number; capped: boolean }> {
  const batchSize = limits.batchSize ?? CHAT_RETENTION_BATCH_SIZE
  const maxBatches = limits.maxBatches ?? CHAT_RETENTION_MAX_BATCHES
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > CHAT_RETENTION_BATCH_SIZE) {
    throw new Error(`batchSize must be an integer from 1 to ${CHAT_RETENTION_BATCH_SIZE}`)
  }
  if (!Number.isInteger(maxBatches) || maxBatches < 1 || maxBatches > CHAT_RETENTION_MAX_BATCHES) {
    throw new Error(`maxBatches must be an integer from 1 to ${CHAT_RETENTION_MAX_BATCHES}`)
  }

  const cutoff = getChatRetentionCutoff(asOf)
  const result: { selectedThreads: number; deletedThreads: number; capped: boolean } = {
    selectedThreads: 0,
    deletedThreads: 0,
    capped: false,
  }

  for (let batch = 0; batch < maxBatches; batch++) {
    const rows = await query`
      WITH batch AS MATERIALIZED (
        SELECT id
        FROM ai_threads
        WHERE "archivedAt" IS NOT NULL
          AND "archivedAt" <= ${cutoff.toISOString()}
        ORDER BY "archivedAt", id
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      ), deleted AS (
        DELETE FROM ai_threads t
        USING batch b
        WHERE t.id = b.id
          AND t."archivedAt" IS NOT NULL
          AND t."archivedAt" <= ${cutoff.toISOString()}
        RETURNING t.id
      )
      SELECT
        (SELECT COUNT(*)::int FROM deleted) AS deleted,
        (SELECT COUNT(*)::int FROM batch) AS batch_count
    `
    const deleted = Number(rows[0]?.deleted ?? 0)
    const selected = Number(rows[0]?.batch_count ?? deleted)
    result.deletedThreads += deleted
    result.selectedThreads += selected
    limits.onBatch?.({
      phase: 'archivedThreads',
      batch: batch + 1,
      counts: { selectedThreads: selected, deletedThreads: deleted },
    })
    if (selected < batchSize) return result
    if (batch === maxBatches - 1) result.capped = true
  }

  return result
}

