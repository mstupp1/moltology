/**
 * Neon storage + retention policy (lean by default, lenient overlay).
 *
 * Windows live here so jobs, reports, and the plan stay in lockstep.
 * Destructive apply is a later phase — this module is classification only.
 *
 * Source of truth for the written plan: docs/neon-storage-retention.md
 */

export type RetentionProfile = 'lean' | 'lenient'

export type RetentionClass =
  | 'canonical'
  | 'hot-delete'
  | 'hot-summarize-delete'
  | 'hot-summarize-archive-delete'
  | 'legal'
  | 'auth-managed'

export type TableRetentionPolicy = {
  table: string
  retentionClass: RetentionClass
  /** Keep full rows this many days. Null = keep for the life of the account. */
  hotDays: number | null
  /** Compact into a summary row after this many days. */
  summarizeAfterDays?: number
  /** Dump off-database (private object storage) after this many days. */
  archiveAfterDays?: number
  /** Hard-delete source rows after this many days (post-summarize/archive). */
  deleteAfterDays?: number
  /** Shorter window for `profiles.isSimulated = true` telemetry. */
  simulatedDays?: number
  notes: string
}

export type RetentionWindows = {
  activityEventsHotDays: number
  notificationsReadDays: number
  notificationsUnreadDays: number
  routineCompletionsHotDays: number
  routineDaySummaryDays: number
  aiMessagesHotDays: number
  aiArchivedThreadKeepDays: number
  friendRequestClosedDays: number
  leadsUnconvertedDays: number
  simulatedTelemetryDays: number
}

export const LEAN_WINDOWS: RetentionWindows = {
  activityEventsHotDays: 14,
  notificationsReadDays: 14,
  notificationsUnreadDays: 90,
  routineCompletionsHotDays: 45,
  routineDaySummaryDays: 400,
  aiMessagesHotDays: 90,
  aiArchivedThreadKeepDays: 180,
  friendRequestClosedDays: 30,
  leadsUnconvertedDays: 730,
  simulatedTelemetryDays: 14,
}

/** Relaxed overlay — flip `RETENTION_PROFILE=lenient` when storage headroom allows. */
export const LENIENT_WINDOWS: RetentionWindows = {
  activityEventsHotDays: 90,
  notificationsReadDays: 90,
  notificationsUnreadDays: 365,
  routineCompletionsHotDays: 120,
  routineDaySummaryDays: 1095,
  aiMessagesHotDays: 365,
  aiArchivedThreadKeepDays: 730,
  friendRequestClosedDays: 90,
  leadsUnconvertedDays: 1825,
  simulatedTelemetryDays: 90,
}

export const RETENTION_PROFILES: Record<RetentionProfile, RetentionWindows> = {
  lean: LEAN_WINDOWS,
  lenient: LENIENT_WINDOWS,
}

/** Neon Free v3 logical size cap for this project (bytes). */
export const NEON_FREE_BRANCH_LIMIT_BYTES = 512 * 1024 * 1024

export const STORAGE_WARN_RATIO = 0.4
export const STORAGE_CRITICAL_RATIO = 0.7

export function parseRetentionProfile(raw: string | undefined | null): RetentionProfile {
  return raw === 'lenient' ? 'lenient' : 'lean'
}

export function getRetentionWindows(profile: RetentionProfile = 'lean'): RetentionWindows {
  return RETENTION_PROFILES[profile]
}

export function buildTablePolicies(windows: RetentionWindows): TableRetentionPolicy[] {
  return [
    {
      table: 'profiles',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Account identity. Purge only on account deletion (privacy: 90 days after close).',
    },
    {
      table: 'user_stats',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Current moltmax / biometric snapshot. One row per member.',
    },
    {
      table: 'routines',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Member-defined cadence definitions, not the completion log.',
    },
    {
      table: 'friendships',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Active bonds. Keep while the account exists.',
    },
    {
      table: 'user_gear_items',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Current vault / loadout. Not a time series.',
    },
    {
      table: 'user_avatars',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Small row count. Image bytes already live in object storage.',
    },
    {
      table: 'equipment_catalog',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Published chassis catalog. Version in git + DB; never TTL.',
    },
    {
      table: 'forum_categories',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Canonical community taxonomy.',
    },
    {
      table: 'forum_topics',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Public community record. Cap simulation spawn rate instead of deleting.',
    },
    {
      table: 'forum_posts',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Public replies. Same as topics — keep; throttle the simulator.',
    },
    {
      table: 'forum_votes',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Vote rows are tiny. Drop only with the parent topic/post.',
    },
    {
      table: 'blog_posts',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Editorial canon. Heavy TOAST; keep. Media URLs point at S3.',
    },
    {
      table: 'blog_comments',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Public comments. Keep while the post exists.',
    },
    {
      table: 'changelogs',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'System transmutation log. Keep published rows.',
    },
    {
      table: 'podcasts',
      retentionClass: 'canonical',
      hotDays: null,
      notes: 'Catalog only. Audio already in S3 (`s3Key` / `audioUrl`).',
    },
    {
      table: 'activity_events',
      retentionClass: 'hot-delete',
      hotDays: windows.activityEventsHotDays,
      deleteAfterDays: windows.activityEventsHotDays,
      simulatedDays: windows.simulatedTelemetryDays,
      notes: 'HUD stream shows 8 rows. No archive value. Delete past the hot window.',
    },
    {
      table: 'notifications',
      retentionClass: 'hot-delete',
      hotDays: windows.notificationsUnreadDays,
      deleteAfterDays: windows.notificationsUnreadDays,
      notes: `Read rows drop after ${windows.notificationsReadDays}d; unread after ${windows.notificationsUnreadDays}d.`,
    },
    {
      table: 'friend_requests',
      retentionClass: 'hot-delete',
      hotDays: windows.friendRequestClosedDays,
      deleteAfterDays: windows.friendRequestClosedDays,
      notes: 'Delete rejected/cancelled after the closed window. Accepted rows may drop once a friendship exists.',
    },
    {
      table: 'routine_completions',
      retentionClass: 'hot-summarize-delete',
      hotDays: windows.routineCompletionsHotDays,
      summarizeAfterDays: windows.routineCompletionsHotDays,
      deleteAfterDays: windows.routineDaySummaryDays,
      simulatedDays: windows.simulatedTelemetryDays,
      notes: `Per-task rows for ${windows.routineCompletionsHotDays}d (toggles + 14-day matrix). Daily counts for ${windows.routineDaySummaryDays}d (52-week heatmap).`,
    },
    {
      table: 'ai_threads',
      retentionClass: 'hot-summarize-archive-delete',
      hotDays: windows.aiMessagesHotDays,
      summarizeAfterDays: windows.aiMessagesHotDays,
      archiveAfterDays: windows.aiMessagesHotDays,
      deleteAfterDays: windows.aiArchivedThreadKeepDays,
      notes: 'Keep the thread row + summary after messages are archived. Drop stale archived/unpinned threads later.',
    },
    {
      table: 'ai_messages',
      retentionClass: 'hot-summarize-archive-delete',
      hotDays: windows.aiMessagesHotDays,
      summarizeAfterDays: windows.aiMessagesHotDays,
      archiveAfterDays: windows.aiMessagesHotDays,
      deleteAfterDays: windows.aiMessagesHotDays,
      notes: 'Largest growth risk (JSONB `parts`). Summarize, dump JSONL to private storage, then delete.',
    },
    {
      table: 'leads',
      retentionClass: 'legal',
      hotDays: windows.leadsUnconvertedDays,
      deleteAfterDays: windows.leadsUnconvertedDays,
      notes: 'Unconverted leads: anonymize email after the window. Converted rows follow the account.',
    },
    {
      table: 'neon_auth.session',
      retentionClass: 'auth-managed',
      hotDays: null,
      notes: 'Managed Auth. Do not TTL from app code. Watch dead tuples / autovacuum.',
    },
    {
      table: 'neon_auth.verification',
      retentionClass: 'auth-managed',
      hotDays: null,
      notes: 'Ephemeral tokens. High dead-tuple count is expected; leave to autovacuum.',
    },
  ]
}

export function cutoffDate(now: Date, days: number): Date {
  const next = new Date(now.getTime())
  next.setUTCDate(next.getUTCDate() - days)
  return next
}

export function cutoffDateString(now: Date, days: number): string {
  return cutoffDate(now, days).toISOString().slice(0, 10)
}

export function isPastCutoff(createdAt: Date, now: Date, days: number): boolean {
  return createdAt.getTime() < cutoffDate(now, days).getTime()
}

export type StorageHeadroom = {
  usedBytes: number
  limitBytes: number
  usedRatio: number
  status: 'ok' | 'warn' | 'critical'
  remainingBytes: number
}

export function evaluateStorageHeadroom(
  usedBytes: number,
  limitBytes: number = NEON_FREE_BRANCH_LIMIT_BYTES
): StorageHeadroom {
  const usedRatio = limitBytes <= 0 ? 1 : usedBytes / limitBytes
  const status: StorageHeadroom['status'] =
    usedRatio >= STORAGE_CRITICAL_RATIO ? 'critical' : usedRatio >= STORAGE_WARN_RATIO ? 'warn' : 'ok'
  return {
    usedBytes,
    limitBytes,
    usedRatio,
    status,
    remainingBytes: Math.max(0, limitBytes - usedBytes),
  }
}

export type NotificationDeleteEligibility = {
  readAt: Date | null
  createdAt: Date
  simulated?: boolean
}

export function isNotificationEligibleForDelete(
  row: NotificationDeleteEligibility,
  now: Date,
  windows: RetentionWindows
): boolean {
  if (row.simulated) {
    return isPastCutoff(row.createdAt, now, windows.simulatedTelemetryDays)
  }
  if (row.readAt) {
    return isPastCutoff(row.readAt, now, windows.notificationsReadDays)
  }
  return isPastCutoff(row.createdAt, now, windows.notificationsUnreadDays)
}

export type FriendRequestDeleteEligibility = {
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  createdAt: Date
  respondedAt: Date | null
}

export function isClosedFriendRequestEligibleForDelete(
  row: FriendRequestDeleteEligibility,
  now: Date,
  windows: RetentionWindows
): boolean {
  if (row.status === 'pending') return false
  const closedAt = row.respondedAt ?? row.createdAt
  return isPastCutoff(closedAt, now, windows.friendRequestClosedDays)
}

export type AiMessageArchiveEligibility = {
  createdAt: Date
  threadPinned: boolean
  threadArchivedAt: Date | null
}

/**
 * Pinned threads stay hot. Archived or aged unpinned threads may leave hot storage.
 */
export function isAiMessageEligibleForArchive(
  row: AiMessageArchiveEligibility,
  now: Date,
  windows: RetentionWindows
): boolean {
  if (row.threadPinned) return false
  if (row.threadArchivedAt) {
    return isPastCutoff(row.threadArchivedAt, now, windows.aiMessagesHotDays)
  }
  return isPastCutoff(row.createdAt, now, windows.aiMessagesHotDays)
}

export function archiveObjectKey(kind: 'ai-thread' | 'routine-day', parts: {
  at: Date
  userId: string
  id: string
}): string {
  const year = parts.at.toISOString().slice(0, 4)
  const month = parts.at.toISOString().slice(5, 7)
  return `archives/${kind}/${year}/${month}/${parts.userId}/${parts.id}.jsonl`
}
