import {
  cutoffDate,
  getRetentionWindows,
  type RetentionProfile,
} from '../../src/lib/data-retention'
import {
  RETENTION_BATCH_SIZE,
  RETENTION_MAX_BATCHES,
  type RetentionProgressCallback,
  type RetentionQuery,
} from './db-retention-cleanup'

export const USAGE_RETENTION_BATCH_SIZE = RETENTION_BATCH_SIZE
export const USAGE_RETENTION_MAX_BATCHES = RETENTION_MAX_BATCHES

export type UsageRetentionCutoffs = {
  rawEvents: Date
  dailySummaries: string
}

export type UsageRetentionCandidateCounts = {
  rawEventsToCompact: number
  dailySummariesToExpire: number
}

export type UsageRetentionApplyResult = {
  compactedEvents: number
  touchedSummaryKeys: number
  expiredDailySummaries: number
  compactionCapped: boolean
  summaryExpiryCapped: boolean
  capped: boolean
}

function utcDateCutoff(asOf: Date, days: number): string {
  const cutoff = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth(), asOf.getUTCDate() - days))
  return cutoff.toISOString().slice(0, 10)
}

export function getUsageRetentionCutoffs(asOf: Date, profile: RetentionProfile): UsageRetentionCutoffs {
  const windows = getRetentionWindows(profile)
  return {
    rawEvents: cutoffDate(asOf, windows.aiUsageEventsHotDays),
    dailySummaries: utcDateCutoff(asOf, windows.aiUsageDailySummaryDays),
  }
}

function asCount(rows: Array<Record<string, unknown>>): number {
  return Number(rows[0]?.count ?? 0)
}

export async function countUsageRetentionCandidates(
  query: RetentionQuery,
  asOf: Date,
  profile: RetentionProfile
): Promise<UsageRetentionCandidateCounts> {
  const cutoffs = getUsageRetentionCutoffs(asOf, profile)
  const [rawRows, summaryRows] = await Promise.all([
    query`SELECT COUNT(*)::int AS count FROM ai_usage_events WHERE "createdAt" < ${cutoffs.rawEvents.toISOString()}`,
    query`SELECT COUNT(*)::int AS count FROM ai_usage_daily_summaries WHERE "date" < ${cutoffs.dailySummaries}`,
  ])
  return {
    rawEventsToCompact: asCount(rawRows),
    dailySummariesToExpire: asCount(summaryRows),
  }
}

function validateBatchLimits(batchSize: number, maxBatches: number) {
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('batchSize must be a positive integer')
  if (!Number.isInteger(maxBatches) || maxBatches < 1) throw new Error('maxBatches must be a positive integer')
  if (batchSize > USAGE_RETENTION_BATCH_SIZE) throw new Error(`batchSize cannot exceed ${USAGE_RETENTION_BATCH_SIZE}`)
  if (maxBatches > USAGE_RETENTION_MAX_BATCHES) throw new Error(`maxBatches cannot exceed ${USAGE_RETENTION_MAX_BATCHES}`)
}

export async function applyUsageRetention(
  query: RetentionQuery,
  asOf: Date,
  profile: RetentionProfile,
  limits: { batchSize?: number; maxBatches?: number; onBatch?: RetentionProgressCallback } = {}
): Promise<UsageRetentionApplyResult> {
  const batchSize = limits.batchSize ?? USAGE_RETENTION_BATCH_SIZE
  const maxBatches = limits.maxBatches ?? USAGE_RETENTION_MAX_BATCHES
  validateBatchLimits(batchSize, maxBatches)

  const cutoffs = getUsageRetentionCutoffs(asOf, profile)
  const result: UsageRetentionApplyResult = {
    compactedEvents: 0,
    touchedSummaryKeys: 0,
    expiredDailySummaries: 0,
    compactionCapped: false,
    summaryExpiryCapped: false,
    capped: false,
  }

  for (let batch = 0; batch < maxBatches; batch++) {
    const rows = await query`
      WITH batch AS MATERIALIZED (
        SELECT e.id
        FROM ai_usage_events e
        WHERE e."createdAt" < ${cutoffs.rawEvents.toISOString()}
        ORDER BY e."createdAt", e.id
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      ), deleted AS (
        DELETE FROM ai_usage_events e
        USING batch b
        WHERE e.id = b.id
        RETURNING
          e."userId",
          e.kind,
          COALESCE(e.model, '') AS model,
          CASE
            WHEN pg_typeof(e."createdAt") = 'timestamp with time zone'::regtype
              THEN (e."createdAt" AT TIME ZONE 'UTC')::date
            ELSE e."createdAt"::date
          END AS utc_day,
          e."inputTokens",
          e."outputTokens"
      ), grouped AS (
        SELECT
          "userId",
          to_char(utc_day, 'YYYY-MM-DD') AS "date",
          kind,
          model,
          COUNT(*)::integer AS "requestCount",
          COALESCE(SUM("inputTokens"), 0)::bigint AS "inputTokens",
          COALESCE(SUM("outputTokens"), 0)::bigint AS "outputTokens",
          COUNT(*) FILTER (WHERE "inputTokens" IS NULL)::integer AS "missingInputTokenCount",
          COUNT(*) FILTER (WHERE "outputTokens" IS NULL)::integer AS "missingOutputTokenCount"
        FROM deleted
        GROUP BY "userId", utc_day, kind, model
      ), upserted AS (
        INSERT INTO ai_usage_daily_summaries (
          "userId", "date", kind, model, "requestCount", "inputTokens", "outputTokens",
          "missingInputTokenCount", "missingOutputTokenCount", "updatedAt"
        )
        SELECT
          "userId", "date", kind, model, "requestCount", "inputTokens", "outputTokens",
          "missingInputTokenCount", "missingOutputTokenCount", CURRENT_TIMESTAMP
        FROM grouped
        ON CONFLICT ("userId", "date", kind, model) DO UPDATE SET
          "requestCount" = ai_usage_daily_summaries."requestCount" + EXCLUDED."requestCount",
          "inputTokens" = ai_usage_daily_summaries."inputTokens" + EXCLUDED."inputTokens",
          "outputTokens" = ai_usage_daily_summaries."outputTokens" + EXCLUDED."outputTokens",
          "missingInputTokenCount" = ai_usage_daily_summaries."missingInputTokenCount" + EXCLUDED."missingInputTokenCount",
          "missingOutputTokenCount" = ai_usage_daily_summaries."missingOutputTokenCount" + EXCLUDED."missingOutputTokenCount",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING 1
      )
      SELECT
        (SELECT COUNT(*)::int FROM deleted) AS deleted,
        (SELECT COUNT(*)::int FROM upserted) AS touched_summary_keys
    `
    const deleted = Number(rows[0]?.deleted ?? 0)
    const touchedSummaryKeys = Number(rows[0]?.touched_summary_keys ?? 0)
    result.compactedEvents += deleted
    result.touchedSummaryKeys += touchedSummaryKeys
    limits.onBatch?.({
      phase: 'compactedEvents',
      batch: batch + 1,
      counts: { compactedEvents: deleted, touchedSummaryKeys },
    })
    if (deleted < batchSize) break
    if (batch === maxBatches - 1) result.compactionCapped = true
  }

  for (let batch = 0; batch < maxBatches; batch++) {
    const rows = await query`
      WITH batch AS MATERIALIZED (
        SELECT "userId", "date", kind, model
        FROM ai_usage_daily_summaries
        WHERE "date" < ${cutoffs.dailySummaries}
        ORDER BY "date", "userId", kind, model
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      ), deleted AS (
        DELETE FROM ai_usage_daily_summaries s
        USING batch b
        WHERE s."userId" = b."userId"
          AND s."date" = b."date"
          AND s.kind = b.kind
          AND s.model = b.model
        RETURNING s."userId"
      )
      SELECT COUNT(*)::int AS deleted FROM deleted
    `
    const deleted = Number(rows[0]?.deleted ?? rows[0]?.count ?? 0)
    result.expiredDailySummaries += deleted
    limits.onBatch?.({
      phase: 'expiredDailySummaries',
      batch: batch + 1,
      counts: { expiredDailySummaries: deleted },
    })
    if (deleted < batchSize) break
    if (batch === maxBatches - 1) result.summaryExpiryCapped = true
  }

  result.capped = result.compactionCapped || result.summaryExpiryCapped
  return result
}

