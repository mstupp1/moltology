import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { env } from '../src/env'
import {
  NEON_FREE_BRANCH_LIMIT_BYTES,
  buildTablePolicies,
  cutoffDate,
  cutoffDateString,
  evaluateStorageHeadroom,
  getRetentionWindows,
  parseRetentionProfile,
  type RetentionProfile,
} from '../src/lib/data-retention'

function asCount(rows: Array<{ count: number | string }> | undefined): number {
  return Number(rows?.[0]?.count ?? 0)
}

function isLiveDatabaseUrl(url: string): boolean {
  return Boolean(url) && !url.includes('ep-dummy') && !url.includes('dummy@')
}

async function main() {
  const args = process.argv.slice(2)
  if (args.includes('--apply')) {
    console.error(
      '[retention] --apply is not implemented. This reporter is dry-run only. See docs/neon-storage-retention.md.'
    )
    process.exit(2)
  }

  const profile: RetentionProfile = parseRetentionProfile(process.env.RETENTION_PROFILE)
  const windows = getRetentionWindows(profile)
  const now = new Date()
  const policies = buildTablePolicies(windows)

  console.log(`[retention] profile=${profile} at ${now.toISOString()}`)
  console.log('[retention] lean→lenient overlay is env RETENTION_PROFILE=lenient')

  if (!isLiveDatabaseUrl(env.DATABASE_URL)) {
    console.log('[retention] No live DATABASE_URL. Printing policy only.')
    console.table(
      policies.map((policy) => ({
        table: policy.table,
        class: policy.retentionClass,
        hotDays: policy.hotDays,
        summarize: policy.summarizeAfterDays ?? '',
        archive: policy.archiveAfterDays ?? '',
        delete: policy.deleteAfterDays ?? '',
        simulated: policy.simulatedDays ?? '',
      }))
    )
    process.exit(0)
  }

  const query = neon(env.DATABASE_URL)
  const activityCutoff = cutoffDate(now, windows.activityEventsHotDays)
  const simulatedCutoff = cutoffDate(now, windows.simulatedTelemetryDays)
  const notifReadCutoff = cutoffDate(now, windows.notificationsReadDays)
  const notifUnreadCutoff = cutoffDate(now, windows.notificationsUnreadDays)
  const friendCutoff = cutoffDate(now, windows.friendRequestClosedDays)
  const completionHot = cutoffDateString(now, windows.routineCompletionsHotDays)
  const completionSummary = cutoffDateString(now, windows.routineDaySummaryDays)
  const aiCutoff = cutoffDate(now, windows.aiMessagesHotDays)
  const leadsCutoff = cutoffDate(now, windows.leadsUnconvertedDays)

  const dbSizeRows = await query`SELECT pg_database_size(current_database())::bigint AS count`
  const dbSizeBytes = asCount(dbSizeRows)
  const headroom = evaluateStorageHeadroom(dbSizeBytes, NEON_FREE_BRANCH_LIMIT_BYTES)

  const [
    activityHotDelete,
    activitySimulated,
    notificationsDelete,
    friendClosed,
    completionsPastHot,
    completionsPastSummary,
    aiMessagesPastHot,
    leadsUnconverted,
    leftoverMemberBonds,
  ] = await Promise.all([
    query`SELECT COUNT(*)::int AS count FROM activity_events WHERE "createdAt" < ${activityCutoff}`.then(asCount),
    query`
      SELECT COUNT(*)::int AS count
      FROM activity_events e
      JOIN profiles p ON p.id = e."userId"
      WHERE p."isSimulated" = true AND e."createdAt" < ${simulatedCutoff}
    `.then(asCount),
    query`
      SELECT COUNT(*)::int AS count
      FROM notifications
      WHERE ("readAt" IS NOT NULL AND "readAt" < ${notifReadCutoff})
         OR ("readAt" IS NULL AND "createdAt" < ${notifUnreadCutoff})
    `.then(asCount),
    query`
      SELECT COUNT(*)::int AS count
      FROM friend_requests
      WHERE status IN ('rejected', 'cancelled', 'accepted')
        AND COALESCE("respondedAt", "createdAt") < ${friendCutoff}
    `.then(asCount),
    query`SELECT COUNT(*)::int AS count FROM routine_completions WHERE "completedOn" < ${completionHot}`.then(asCount),
    query`SELECT COUNT(*)::int AS count FROM routine_completions WHERE "completedOn" < ${completionSummary}`.then(asCount),
    query`SELECT COUNT(*)::int AS count FROM ai_messages WHERE "createdAt" < ${aiCutoff}`.then(asCount),
    query`
      SELECT COUNT(*)::int AS count
      FROM leads
      WHERE "convertedToUser" = false AND "createdAt" < ${leadsCutoff}
    `.then(asCount),
    query`
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'member_bonds'
    `.then(asCount),
  ])

  const candidates = [
    { bucket: 'activity_events past hot window', rows: activityHotDelete },
    { bucket: 'activity_events simulated past sim window', rows: activitySimulated },
    { bucket: 'notifications past read/unread window', rows: notificationsDelete },
    { bucket: 'friend_requests closed past window', rows: friendClosed },
    { bucket: 'routine_completions past per-task hot window', rows: completionsPastHot },
    { bucket: 'routine_completions past daily-summary window', rows: completionsPastSummary },
    { bucket: 'ai_messages past hot window', rows: aiMessagesPastHot },
    { bucket: 'leads unconverted past legal window', rows: leadsUnconverted },
  ]

  console.log(
    `[retention] database_size=${dbSizeBytes} bytes (${(dbSizeBytes / (1024 * 1024)).toFixed(1)} MB) status=${headroom.status} remaining=${headroom.remainingBytes}`
  )
  console.table(candidates)
  if (leftoverMemberBonds > 0) {
    console.log('[retention] leftover public.member_bonds still exists (empty legacy table — drop in a later migration).')
  }

  const totalCandidates = candidates.reduce((sum, row) => sum + row.rows, 0)
  console.log(`[retention] dry-run candidate rows=${totalCandidates} (no deletes performed)`)

  if (headroom.status === 'critical') {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[retention] report failed:', err)
  process.exit(1)
})
