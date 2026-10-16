import {
  cutoffDateString,
  getRetentionWindows,
  type RetentionProfile,
} from '../../src/lib/data-retention'
import { shiftDays, TOTAL_ALIGNMENT_TASKS } from '../../src/lib/alignment-tasks'
import type { RetentionProgressCallback } from './db-retention-cleanup'

export const COMPLETION_RETENTION_BATCH_SIZE = 250
export const COMPLETION_RETENTION_MAX_BATCHES = 20

export type CompletionRetentionQuery = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Array<Record<string, unknown>>>

export type CompletionRetentionCounts = {
  rawRowsToExpire: number
  rawRowsToSummarize: number
  summaryDaysToExpire: number
}

export function getCompletionRetentionCutoffs(asOf: Date, profile: RetentionProfile) {
  const windows = getRetentionWindows(profile)
  return {
    // The cutoff is the first retained date, so a 90-day inclusive window is
    // today plus the preceding 89 UTC calendar dates.
    raw: cutoffDateString(asOf, Math.max(0, windows.routineCompletionsHotDays - 1)),
    summaries: cutoffDateString(asOf, Math.max(0, windows.routineDaySummaryDays - 1)),
  }
}

export async function countCompletionRetentionCandidates(
  query: CompletionRetentionQuery,
  asOf: Date,
  profile: RetentionProfile,
): Promise<CompletionRetentionCounts> {
  const cutoffs = getCompletionRetentionCutoffs(asOf, profile)
  const carryAnchorDate = shiftDays(cutoffs.summaries, -1)
  const [rawRows] = await query`
    SELECT
      COUNT(*) FILTER (WHERE c."completedOn" < ${cutoffs.summaries})::int AS "rawRowsToExpire",
      COUNT(*) FILTER (
        WHERE c."completedOn" < ${cutoffs.raw}
          AND c."completedOn" >= ${cutoffs.summaries}
      )::int AS "rawRowsToSummarize"
    FROM routine_completions c
    LEFT JOIN routine_streak_carries sc ON sc."userId" = c."userId"
      AND sc."anchorDate" >= ${carryAnchorDate}
    WHERE c."completedOn" >= ${cutoffs.summaries} OR sc."userId" IS NOT NULL
  `
  const [summaryRows] = await query`
    SELECT COUNT(*)::int AS count
    FROM routine_day_summaries s
    JOIN routine_streak_carries sc ON sc."userId" = s."userId"
      AND sc."anchorDate" >= ${carryAnchorDate}
    WHERE s."completedOn" < ${cutoffs.summaries}
  `
  return {
    rawRowsToExpire: Number(rawRows?.rawRowsToExpire ?? 0),
    rawRowsToSummarize: Number(rawRows?.rawRowsToSummarize ?? 0),
    summaryDaysToExpire: Number(summaryRows?.count ?? 0),
  }
}

export async function applyCompletionRetention(
  query: CompletionRetentionQuery,
  asOf: Date,
  profile: RetentionProfile,
  limits: { batchSize?: number; maxBatches?: number; onBatch?: RetentionProgressCallback } = {},
): Promise<CompletionRetentionCounts & { capped: boolean }> {
  const batchSize = limits.batchSize ?? COMPLETION_RETENTION_BATCH_SIZE
  const maxBatches = limits.maxBatches ?? COMPLETION_RETENTION_MAX_BATCHES
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > COMPLETION_RETENTION_BATCH_SIZE) {
    throw new Error(`batchSize must be an integer from 1 to ${COMPLETION_RETENTION_BATCH_SIZE}`)
  }
  if (!Number.isInteger(maxBatches) || maxBatches < 1 || maxBatches > COMPLETION_RETENTION_MAX_BATCHES) {
    throw new Error(`maxBatches must be an integer from 1 to ${COMPLETION_RETENTION_MAX_BATCHES}`)
  }

  const cutoffs = getCompletionRetentionCutoffs(asOf, profile)
  const carryAnchorDate = shiftDays(cutoffs.summaries, -1)
  const counts: CompletionRetentionCounts & { capped: boolean } = {
    rawRowsToExpire: 0,
    rawRowsToSummarize: 0,
    summaryDaysToExpire: 0,
    capped: false,
  }

  // Advance a single counter per member before expiring any source history.
  // The rank/date equality counts only complete days in the uninterrupted run
  // ending on the day immediately before the retained 90-day window. Existing
  // carry state seeds days already compacted by an earlier run; reruns at the
  // same cutoff leave that state unchanged.
  for (let batch = 0; batch < maxBatches; batch++) {
    const carryRows = await query`
    WITH batch_users AS MATERIALIZED (
      SELECT candidates."userId"
      FROM (
        SELECT c."userId" FROM routine_completions c WHERE c."completedOn" <= ${carryAnchorDate}
        UNION
        SELECT s."userId" FROM routine_day_summaries s WHERE s."completedOn" <= ${carryAnchorDate}
        UNION
        SELECT "userId" FROM routine_streak_carries WHERE "anchorDate" < ${carryAnchorDate}
      ) candidates
      LEFT JOIN routine_streak_carries prior USING ("userId")
      WHERE prior."anchorDate" IS NULL OR prior."anchorDate" < ${carryAnchorDate}
      ORDER BY candidates."userId"
      LIMIT ${batchSize}
    ), previous AS MATERIALIZED (
      SELECT "userId", "anchorDate", "streakDays"
      FROM routine_streak_carries
      JOIN batch_users USING ("userId")
    ), source_keys AS (
      SELECT c."userId", c."completedOn", c."taskKey"
      FROM routine_completions c
      JOIN batch_users b USING ("userId")
      LEFT JOIN previous p USING ("userId")
      WHERE c."completedOn" <= ${carryAnchorDate}
        AND (p."userId" IS NULL OR c."completedOn" > p."anchorDate")
      UNION
      SELECT s."userId", s."completedOn", unnest(s."taskKeys") AS "taskKey"
      FROM routine_day_summaries s
      JOIN batch_users b USING ("userId")
      LEFT JOIN previous p USING ("userId")
      WHERE s."completedOn" <= ${carryAnchorDate}
        AND (p."userId" IS NULL OR s."completedOn" > p."anchorDate")
    ), full_days AS (
      SELECT "userId", "completedOn"::date AS completed_date
      FROM source_keys
      GROUP BY "userId", "completedOn"
      HAVING COUNT(DISTINCT "taskKey") = ${TOTAL_ALIGNMENT_TASKS}
    ), ranked AS (
      SELECT
        "userId",
        completed_date,
        ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY completed_date DESC) AS day_rank
      FROM full_days
    ), full_day_suffix AS (
      SELECT "userId", COUNT(*)::int AS trailing_days
      FROM ranked
      WHERE completed_date + (day_rank::int - 1) = ${carryAnchorDate}::date
      GROUP BY "userId"
    ), candidate_users AS (
      SELECT "userId" FROM batch_users
    ), carry_values AS (
      SELECT
        u."userId",
        CASE
          WHEN p."anchorDate" >= ${carryAnchorDate} THEN p."streakDays"
          WHEN p."anchorDate" IS NOT NULL
            AND COALESCE(t.trailing_days, 0) = (${carryAnchorDate}::date - p."anchorDate"::date)
            THEN p."streakDays" + COALESCE(t.trailing_days, 0)
          ELSE COALESCE(t.trailing_days, 0)
        END::int AS streak_days
      FROM candidate_users u
      LEFT JOIN previous p USING ("userId")
      LEFT JOIN full_day_suffix t USING ("userId")
    ), saved AS (
      INSERT INTO routine_streak_carries ("userId", "anchorDate", "streakDays")
      SELECT "userId", ${carryAnchorDate}, streak_days FROM carry_values
      ON CONFLICT ("userId") DO UPDATE
      SET "anchorDate" = EXCLUDED."anchorDate",
          "streakDays" = EXCLUDED."streakDays",
          "updatedAt" = now()
      WHERE routine_streak_carries."anchorDate" <= EXCLUDED."anchorDate"
      RETURNING 1
    )
    SELECT
      (SELECT COUNT(*) FROM saved)::int AS changed,
      (SELECT COUNT(*) FROM batch_users)::int AS batch_count
    `
    const changed = Number(carryRows[0]?.changed ?? 0)
    const batchCount = Number(carryRows[0]?.batch_count ?? 0)
    limits.onBatch?.({
      phase: 'streakCarryAdvanced',
      batch: batch + 1,
      counts: { streakCarries: changed, selectedUsers: batchCount },
    })
    if (batchCount < batchSize) break
    if (batch === maxBatches - 1) counts.capped = true
  }

  async function drain(
    runBatch: () => Promise<Array<Record<string, unknown>>>,
    key: keyof CompletionRetentionCounts,
  ) {
    for (let batch = 0; batch < maxBatches; batch++) {
      const rows = await runBatch()
      const changed = Number(rows[0]?.changed ?? rows.length)
      const batchCount = Number(rows[0]?.batch_count ?? changed)
      counts[key] += changed
      limits.onBatch?.({
        phase: key,
        batch: batch + 1,
        counts: { [key]: changed, selectedGroups: batchCount },
      })
      if (batchCount < batchSize) return
    }
    counts.capped = true
  }

  // Rows older than the retained heatmap window need no summary. Select whole
  // member/day groups so a date is never partially compacted.
  await drain(
    () => query`
      WITH batch_days AS MATERIALIZED (
        SELECT c."userId", c."completedOn"
        FROM routine_completions c
        JOIN routine_streak_carries sc ON sc."userId" = c."userId"
          AND sc."anchorDate" >= ${carryAnchorDate}
        WHERE c."completedOn" < ${cutoffs.summaries}
        GROUP BY c."userId", c."completedOn"
        ORDER BY c."completedOn", c."userId"
        LIMIT ${batchSize}
      ), deleted AS (
        DELETE FROM routine_completions c
        USING batch_days d
        WHERE c."userId" = d."userId" AND c."completedOn" = d."completedOn"
        RETURNING c.id
      )
      SELECT
        (SELECT COUNT(*) FROM deleted)::int AS changed,
        (SELECT COUNT(*) FROM batch_days)::int AS batch_count
    `,
    'rawRowsToExpire',
  )

  // Each statement atomically removes complete day groups and merges their
  // exact keys into the summary. Unioning handles late simulator rows for a
  // date that already has a compacted summary without losing prior keys.
  for (let batch = 0; batch < maxBatches; batch++) {
    const rows = await query`
      WITH batch_days AS MATERIALIZED (
        SELECT c."userId", c."completedOn"
        FROM routine_completions c
        WHERE c."completedOn" < ${cutoffs.raw}
          AND c."completedOn" >= ${cutoffs.summaries}
        GROUP BY c."userId", c."completedOn"
        ORDER BY c."completedOn", c."userId"
        LIMIT ${batchSize}
      ), deleted AS (
        DELETE FROM routine_completions c
        USING batch_days d
        WHERE c."userId" = d."userId" AND c."completedOn" = d."completedOn"
        RETURNING c."userId", c."completedOn", c."taskKey"
      ), day_keys AS (
        SELECT
          "userId",
          "completedOn",
          array_agg(DISTINCT "taskKey" ORDER BY "taskKey") AS "taskKeys",
          COUNT(*)::int AS row_count
        FROM deleted
        GROUP BY "userId", "completedOn"
      ), saved AS (
        INSERT INTO routine_day_summaries ("userId", "completedOn", "taskKeys")
        SELECT "userId", "completedOn", "taskKeys" FROM day_keys
        ON CONFLICT ("userId", "completedOn") DO UPDATE
        SET "taskKeys" = ARRAY(
              SELECT DISTINCT task_key
              FROM unnest(routine_day_summaries."taskKeys" || EXCLUDED."taskKeys") AS keys(task_key)
              ORDER BY task_key
            ),
            "updatedAt" = now()
        RETURNING "userId", "completedOn"
      )
      SELECT
        COALESCE(SUM(day_keys.row_count), 0)::int AS changed,
        (SELECT COUNT(*) FROM batch_days)::int AS batch_count
      FROM saved
      JOIN day_keys USING ("userId", "completedOn")
    `
    const changed = Number(rows[0]?.changed ?? rows.length)
    const batchCount = Number(rows[0]?.batch_count ?? changed)
    counts.rawRowsToSummarize += changed
    limits.onBatch?.({
      phase: 'rawRowsToSummarize',
      batch: batch + 1,
      counts: { rawRowsToSummarize: changed, selectedGroups: batchCount },
    })
    if (batchCount < batchSize) break
    if (batch === maxBatches - 1) counts.capped = true
  }

  await drain(
    () => query`
      WITH batch AS MATERIALIZED (
        SELECT s.ctid
        FROM routine_day_summaries s
        JOIN routine_streak_carries sc ON sc."userId" = s."userId"
          AND sc."anchorDate" >= ${carryAnchorDate}
        WHERE s."completedOn" < ${cutoffs.summaries}
        ORDER BY s."completedOn", s."userId"
        LIMIT ${batchSize}
      ), deleted AS (
        DELETE FROM routine_day_summaries s
        USING batch
        WHERE s.ctid = batch.ctid
        RETURNING 1
      )
      SELECT
        (SELECT COUNT(*) FROM deleted)::int AS changed,
        (SELECT COUNT(*) FROM batch)::int AS batch_count
    `,
    'summaryDaysToExpire',
  )

  return counts
}

