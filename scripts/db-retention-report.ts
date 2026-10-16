import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import {
  NEON_FREE_BRANCH_LIMIT_BYTES,
  buildTablePolicies,
  cutoffDate,
  evaluateStorageHeadroom,
  getRetentionWindows,
  parseRetentionProfile,
  type RetentionProfile,
} from '../src/lib/data-retention'
import {
  parseRetentionReportArgs,
  resolveRetentionDatabase,
} from './lib/db-retention-report'
import { countCleanupCandidates, type RetentionQuery } from './lib/db-retention-cleanup'
import { getCompletionRetentionCutoffs } from './lib/db-retention-completions'
import { countChatRetentionCandidates } from './lib/db-retention-chats'
import { CHAT_ARCHIVE_RETENTION_DAYS } from '../src/lib/ai/chat-retention'

function asCount(rows: Array<{ count: number | string }> | undefined): number {
  return Number(rows?.[0]?.count ?? 0)
}

function isLiveDatabaseUrl(url: string): boolean {
  return Boolean(url) && !url.includes('ep-dummy') && !url.includes('dummy@')
}

async function main() {
  const { target } = parseRetentionReportArgs(process.argv.slice(2))
  const database = resolveRetentionDatabase(target, {
    DATABASE_URL: process.env.DATABASE_URL,
    DEV_DATABASE_URL: process.env.DEV_DATABASE_URL,
    PROD_DATABASE_URL: process.env.PROD_DATABASE_URL,
  })
  if (target !== 'default' && !database.url) {
    throw new Error(`No ${target.toUpperCase()}_DATABASE_URL is configured for target=${target}.`)
  }

  const profile: RetentionProfile = parseRetentionProfile(process.env.RETENTION_PROFILE)
  const windows = getRetentionWindows(profile)
  const now = new Date()
  const policies = buildTablePolicies(windows)

  console.log(`[retention] target=${database.label} profile=${profile} at ${now.toISOString()}`)
  console.log('[retention] lean→lenient overlay is env RETENTION_PROFILE=lenient')

  if (!database.url || !isLiveDatabaseUrl(database.url)) {
    console.log(`[retention] No live database URL for target=${database.label}. Printing policy only.`)
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

  const query = neon(database.url)
  const { raw: completionHot, summaries: completionSummary } = getCompletionRetentionCutoffs(now, profile)
  const aiUsageCutoff = cutoffDate(now, windows.aiUsageEventsHotDays)
  const leadsCutoff = cutoffDate(now, windows.leadsUnconvertedDays)

  const dbSizeRows = await query`SELECT pg_database_size(current_database())::bigint AS count`
  const dbSizeBytes = asCount(dbSizeRows)
  const headroom = evaluateStorageHeadroom(dbSizeBytes, NEON_FREE_BRANCH_LIMIT_BYTES)

  const [
    hotDelete,
    completionsPastHot,
    completionsPastSummary,
    expiredArchivedChats,
    aiUsageEventsPastHotWindow,
    leadsUnconverted,
    memberBonds,
  ] = await Promise.all([
    countCleanupCandidates(query as unknown as RetentionQuery, now, profile),
    query`SELECT COUNT(*)::int AS count FROM routine_completions WHERE "completedOn" < ${completionHot}`.then(asCount),
    query`SELECT COUNT(*)::int AS count FROM routine_completions WHERE "completedOn" < ${completionSummary}`.then(asCount),
    countChatRetentionCandidates(query as unknown as RetentionQuery, now),
    query`SELECT COUNT(*)::int AS count FROM ai_usage_events WHERE "createdAt" < ${aiUsageCutoff.toISOString()}`.then(asCount),
    query`
      SELECT COUNT(*)::int AS count
      FROM leads
      WHERE "convertedToUser" = false AND "createdAt" < ${leadsCutoff.toISOString()}
    `.then(asCount),
    query`SELECT COUNT(*)::int AS count FROM member_bonds`.then(asCount),
  ])

  const candidates = [
    { bucket: 'activity_events eligible for hot cleanup (unique rows)', rows: hotDelete.activityEvents },
    { bucket: 'notifications eligible for cleanup (pending request alerts preserved)', rows: hotDelete.notifications },
    { bucket: 'friend_requests eligible for cleanup (accepted requires friendship)', rows: hotDelete.closedFriendRequests },
    { bucket: 'routine_completions past per-task hot window', rows: completionsPastHot },
    { bucket: 'routine_completions past daily-summary window', rows: completionsPastSummary },
    { bucket: `ai_threads archived for ${CHAT_ARCHIVE_RETENTION_DAYS}+ days (thread/message deletion)`, rows: expiredArchivedChats },
    { bucket: `ai_usage_events past ${windows.aiUsageEventsHotDays}-day raw window (requires atomic daily rollup)`, rows: aiUsageEventsPastHotWindow },
    { bucket: 'leads unconverted past legal window', rows: leadsUnconverted },
  ]

  console.log(
    `[retention] pg_database_size=${dbSizeBytes} bytes (${(dbSizeBytes / (1024 * 1024)).toFixed(1)} MiB); estimated logical headroom vs configured cap status=${headroom.status} remaining=${headroom.remainingBytes} bytes (not Neon billable/project storage)`
  )
  console.table(candidates)
  console.log(`[retention] member_bonds rows=${memberBonds}; active table retained.`)
  console.log('[retention] candidate buckets overlap and include informational classifications; counts are not additive or approval to delete.')
  console.log('[retention] Usage raw rows require atomic daily aggregation; completion rows require task-key summaries. Use their dedicated compaction commands.')
  console.log('[retention] XP ledger and signup-risk screening history are protected and excluded from retention candidates.')
  console.log('[retention] dry-run only; no deletes performed.')

  if (headroom.status === 'critical') {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[retention] report failed:', err)
  process.exit(1)
})
