import {
  cutoffDate,
  getRetentionWindows,
  parseRetentionProfile,
  type RetentionProfile,
} from '../../src/lib/data-retention'

export const RETENTION_BATCH_SIZE = 500
export const RETENTION_MAX_BATCHES = 20

export type RetentionTarget = 'dev' | 'prod'

export type CleanupOptions = {
  target: RetentionTarget
  apply: boolean
  profile: RetentionProfile
  backupReference?: string
  recovery?: 'pitr'
  asOf: Date
}

export type CleanupArgResult =
  | { ok: true; options: Omit<CleanupOptions, 'asOf'> & { asOf?: Date } }
  | { ok: false; error: string }

export type RetentionQuery = (
  strings: TemplateStringsArray,
  ...values: unknown[]
) => Promise<Array<Record<string, unknown>>>

export type RetentionBatchProgress = {
  phase: string
  /** One-based batch number within the phase. */
  batch: number
  counts: Record<string, number>
}

export type RetentionProgressCallback = (progress: RetentionBatchProgress) => void

export type CleanupCounts = {
  activityEvents: number
  notifications: number
  closedFriendRequests: number
  linkedNotifications: number
}

const ZERO_COUNTS = (): CleanupCounts => ({
  activityEvents: 0,
  notifications: 0,
  closedFriendRequests: 0,
  linkedNotifications: 0,
})

export function parseCleanupArgs(args: string[], profileRaw?: string | null): CleanupArgResult {
  let target: RetentionTarget | undefined
  let apply = false
  let backupReference: string | undefined
  let recovery: 'pitr' | undefined
  let asOf: Date | undefined

  for (const arg of args) {
    if (arg === '--apply') {
      apply = true
      continue
    }
    if (arg.startsWith('--target=')) {
      const value = arg.slice('--target='.length)
      if (value !== 'dev' && value !== 'prod') return { ok: false, error: `Invalid target "${value}"; use --target=dev or --target=prod.` }
      if (target) return { ok: false, error: 'Specify --target only once.' }
      target = value
      continue
    }
    if (arg.startsWith('--backup-reference=')) {
      backupReference = arg.slice('--backup-reference='.length).trim()
      if (!backupReference) return { ok: false, error: '--backup-reference requires a non-empty operator-supplied reference.' }
      continue
    }
    if (arg.startsWith('--recovery=')) {
      const value = arg.slice('--recovery='.length)
      if (value !== 'pitr') return { ok: false, error: `Invalid recovery strategy "${value}"; use --recovery=pitr.` }
      if (recovery) return { ok: false, error: 'Specify --recovery only once.' }
      recovery = value
      continue
    }
    if (arg.startsWith('--as-of=')) {
      const raw = arg.slice('--as-of='.length)
      const parsed = new Date(raw)
      if (!raw || !Number.isFinite(parsed.getTime())) return { ok: false, error: '--as-of must be a valid date/time.' }
      if (parsed.getTime() > Date.now()) return { ok: false, error: '--as-of cannot be in the future.' }
      asOf = parsed
      continue
    }
    return { ok: false, error: `Unknown option "${arg}".` }
  }

  if (!target) return { ok: false, error: 'Choose a database explicitly with --target=dev or --target=prod.' }
  if (profileRaw && profileRaw !== 'lean' && profileRaw !== 'lenient') {
    return { ok: false, error: `Invalid RETENTION_PROFILE "${profileRaw}"; use lean or lenient.` }
  }
  if (target === 'prod' && apply && !backupReference && recovery !== 'pitr') {
    return { ok: false, error: 'Production apply requires --backup-reference=<operator-supplied snapshot or backup reference> or --recovery=pitr.' }
  }

  return {
    ok: true,
    options: {
      target,
      apply,
      profile: parseRetentionProfile(profileRaw),
      backupReference,
      recovery,
      asOf,
    },
  }
}

export function getTargetDatabaseUrl(
  target: RetentionTarget,
  env: Record<string, string | undefined>
): string | undefined {
  if (target === 'dev' && env.DEV_DATABASE_URL && env.PROD_DATABASE_URL) {
    const endpoint = (url: string) => new URL(url).hostname.replace('-pooler.', '.')
    if (endpoint(env.DEV_DATABASE_URL) === endpoint(env.PROD_DATABASE_URL)) {
      throw new Error('Development and production endpoints match; refusing a dev-target retention run.')
    }
  }
  return target === 'dev' ? env.DEV_DATABASE_URL : env.PROD_DATABASE_URL
}

export function getTargetDatabaseHost(databaseUrl: string): string {
  try {
    return new URL(databaseUrl).host
  } catch {
    return 'unknown'
  }
}

export function getCleanupCutoffs(asOf: Date, profile: RetentionProfile) {
  const windows = getRetentionWindows(profile)
  return {
    activity: cutoffDate(asOf, windows.activityEventsHotDays),
    simulatedActivity: cutoffDate(asOf, windows.simulatedTelemetryDays),
    notificationsRead: cutoffDate(asOf, windows.notificationsReadDays),
    notificationsUnread: cutoffDate(asOf, windows.notificationsUnreadDays),
    friendRequests: cutoffDate(asOf, windows.friendRequestClosedDays),
  }
}

export async function countCleanupCandidates(
  query: RetentionQuery,
  asOf: Date,
  profile: RetentionProfile
): Promise<CleanupCounts> {
  const cutoffs = getCleanupCutoffs(asOf, profile)
  const [activityRows, notificationRows, friendRows, linkedNotificationRows] = await Promise.all([
    query`
      SELECT COUNT(*)::int AS count
      FROM activity_events e
      LEFT JOIN profiles p ON p.id = e."userId"
      WHERE (p."isSimulated" = true AND e."createdAt" < ${cutoffs.simulatedActivity.toISOString()})
         OR (COALESCE(p."isSimulated", false) = false AND e."createdAt" < ${cutoffs.activity.toISOString()})
    `,
    query`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE (
        ("readAt" IS NOT NULL AND "readAt" < ${cutoffs.notificationsRead.toISOString()})
        OR ("readAt" IS NULL AND "createdAt" < ${cutoffs.notificationsUnread.toISOString()})
      )
        AND NOT (
          kind = 'friend_request'
          AND EXISTS (
            SELECT 1 FROM friend_requests fr
            WHERE fr.status = 'pending'
              AND (
                notifications.payload->>'requestId' = fr.id::text
                OR notifications."sourceKey" = 'friend_request:' || fr.id::text
              )
          )
        )
    `,
    query`
      SELECT COUNT(*)::int AS count
      FROM friend_requests fr
      WHERE fr.status IN ('rejected', 'cancelled')
        AND COALESCE(fr."respondedAt", fr."createdAt") < ${cutoffs.friendRequests.toISOString()}
      UNION ALL
      SELECT COUNT(*)::int AS count
      FROM friend_requests fr
      WHERE fr.status = 'accepted'
        AND COALESCE(fr."respondedAt", fr."createdAt") < ${cutoffs.friendRequests.toISOString()}
        AND EXISTS (
          SELECT 1 FROM friendships f
          WHERE f."userAId" = LEAST(fr."senderId", fr."recipientId")
            AND f."userBId" = GREATEST(fr."senderId", fr."recipientId")
        )
    `,
    query`
      SELECT COUNT(DISTINCT n.id)::int AS count
      FROM notifications n
      JOIN friend_requests fr
        ON n.payload->>'requestId' = fr.id::text
        OR (
          n."sourceKey" IN (
            'friend_request:' || fr.id::text
          )
          AND n.payload->>'requestId' IS NULL
        )
      WHERE n.kind = 'friend_request'
        AND fr.status IN ('rejected', 'cancelled', 'accepted')
        AND COALESCE(fr."respondedAt", fr."createdAt") < ${cutoffs.friendRequests.toISOString()}
        AND (
          fr.status IN ('rejected', 'cancelled')
          OR EXISTS (
            SELECT 1 FROM friendships f
            WHERE f."userAId" = LEAST(fr."senderId", fr."recipientId")
              AND f."userBId" = GREATEST(fr."senderId", fr."recipientId")
          )
        )
    `,
  ])
  const count = (rows: Array<Record<string, unknown>>) => Number(rows[0]?.count ?? 0)
  return {
    activityEvents: count(activityRows),
    notifications: count(notificationRows),
    closedFriendRequests: friendRows.reduce((sum, row) => sum + Number(row.count ?? 0), 0),
    linkedNotifications: count(linkedNotificationRows),
  }
}

export async function applyCleanup(
  query: RetentionQuery,
  asOf: Date,
  profile: RetentionProfile,
  limits: { batchSize?: number; maxBatches?: number; onBatch?: RetentionProgressCallback } = {}
): Promise<CleanupCounts & { capped: boolean }> {
  const batchSize = limits.batchSize ?? RETENTION_BATCH_SIZE
  const maxBatches = limits.maxBatches ?? RETENTION_MAX_BATCHES
  if (!Number.isInteger(batchSize) || batchSize < 1) throw new Error('batchSize must be a positive integer')
  if (!Number.isInteger(maxBatches) || maxBatches < 1) throw new Error('maxBatches must be a positive integer')
  if (batchSize > RETENTION_BATCH_SIZE) throw new Error(`batchSize cannot exceed ${RETENTION_BATCH_SIZE}`)
  if (maxBatches > RETENTION_MAX_BATCHES) throw new Error(`maxBatches cannot exceed ${RETENTION_MAX_BATCHES}`)
  const cutoffs = getCleanupCutoffs(asOf, profile)
  const counts = ZERO_COUNTS()
  let capped = false

  async function drain(runBatch: () => Promise<Array<Record<string, unknown>>>, countKey: keyof CleanupCounts) {
    for (let batch = 0; batch < maxBatches; batch++) {
      const rows = await runBatch()
      const deleted = Number(rows[0]?.deleted ?? rows.length)
      if (countKey === 'closedFriendRequests') {
        counts.closedFriendRequests += deleted
        counts.linkedNotifications += Number(rows[0]?.linked_notifications ?? 0)
      } else {
        counts[countKey] += deleted
      }
      limits.onBatch?.({
        phase: countKey,
        batch: batch + 1,
        counts: countKey === 'closedFriendRequests'
          ? { closedFriendRequests: deleted, linkedNotifications: Number(rows[0]?.linked_notifications ?? 0) }
          : { [countKey]: deleted },
      })
      if (deleted < batchSize) return
    }
    capped = true
  }

  await drain(
    () => query`
      WITH batch AS MATERIALIZED (
        SELECT e.id
        FROM activity_events e
        LEFT JOIN profiles p ON p.id = e."userId"
        WHERE (p."isSimulated" = true AND e."createdAt" < ${cutoffs.simulatedActivity.toISOString()})
           OR (COALESCE(p."isSimulated", false) = false AND e."createdAt" < ${cutoffs.activity.toISOString()})
        ORDER BY e."createdAt", e.id
        LIMIT ${batchSize}
        FOR UPDATE OF e SKIP LOCKED
      )
      DELETE FROM activity_events e
      USING batch
      WHERE e.id = batch.id
      RETURNING e.id
    `,
    'activityEvents'
  )
  await drain(
    () => query`
      WITH batch AS MATERIALIZED (
        SELECT id
        FROM notifications
        WHERE (
          ("readAt" IS NOT NULL AND "readAt" < ${cutoffs.notificationsRead.toISOString()})
          OR ("readAt" IS NULL AND "createdAt" < ${cutoffs.notificationsUnread.toISOString()})
        )
          AND NOT (
            kind = 'friend_request'
            AND EXISTS (
              SELECT 1 FROM friend_requests fr
              WHERE fr.status = 'pending'
                AND (
                  notifications.payload->>'requestId' = fr.id::text
                  OR notifications."sourceKey" = 'friend_request:' || fr.id::text
                )
            )
          )
        ORDER BY "createdAt", id
        LIMIT ${batchSize}
        FOR UPDATE SKIP LOCKED
      )
      DELETE FROM notifications n
      USING batch
      WHERE n.id = batch.id
      RETURNING n.id
    `,
    'notifications'
  )
  await drain(
    () => query`
      WITH batch AS MATERIALIZED (
        SELECT fr.id
        FROM friend_requests fr
        WHERE fr.status IN ('rejected', 'cancelled', 'accepted')
          AND COALESCE(fr."respondedAt", fr."createdAt") < ${cutoffs.friendRequests.toISOString()}
          AND (
            fr.status IN ('rejected', 'cancelled')
            OR EXISTS (
              SELECT 1 FROM friendships f
              WHERE f."userAId" = LEAST(fr."senderId", fr."recipientId")
                AND f."userBId" = GREATEST(fr."senderId", fr."recipientId")
            )
          )
        ORDER BY COALESCE(fr."respondedAt", fr."createdAt"), fr.id
        LIMIT ${batchSize}
        FOR UPDATE OF fr SKIP LOCKED
      ), linked_notifications AS (
        DELETE FROM notifications n
        USING batch
        WHERE n.kind = 'friend_request'
          AND (
            n.payload->>'requestId' = batch.id::text
            OR (
              n."sourceKey" IN (
              'friend_request:' || batch.id::text
              )
              AND n.payload->>'requestId' IS NULL
            )
          )
        RETURNING n.id
      ), deleted_requests AS (
        DELETE FROM friend_requests fr
        USING batch
        WHERE fr.id = batch.id
        RETURNING fr.id
      )
      SELECT
        (SELECT COUNT(*)::int FROM deleted_requests) AS deleted,
        (SELECT COUNT(*)::int FROM linked_notifications) AS linked_notifications
    `,
    'closedFriendRequests'
  )
  return { ...counts, capped }
}
