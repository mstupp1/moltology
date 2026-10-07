import { and, eq, gte, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { aiUsageEvents } from '../../db/schema'
import { assertForumWriteRateLimit, forumWriteLimitError } from '../community-rules'

/** `ai_usage_events.kind` for a forum create or edit, each of which runs a moderation model call. */
export const FORUM_WRITE_USAGE_KIND = 'forum_write'

/**
 * Caps forum creates and edits per member before the moderation call runs.
 * The in-memory check stops bursts on one instance. The database count holds
 * across instances, so it is what caps moderation spend. Each allowed attempt
 * is recorded, including ones the moderation model later rejects.
 */
export async function assertForumWriteLimit(userId: string, now: Date = new Date()): Promise<void> {
  assertForumWriteRateLimit(userId)

  let message: string | null = null
  try {
    const db = getDb()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const minuteAgo = new Date(now.getTime() - 60 * 1000)
    const [counts] = await db
      .select({
        lastDay: sql<number>`count(*)::int`,
        lastMinute: sql<number>`count(*) filter (where ${aiUsageEvents.createdAt} >= ${minuteAgo.toISOString()}::timestamp)::int`,
      })
      .from(aiUsageEvents)
      .where(
        and(
          eq(aiUsageEvents.userId, userId),
          eq(aiUsageEvents.kind, FORUM_WRITE_USAGE_KIND),
          gte(aiUsageEvents.createdAt, dayAgo),
        ),
      )
    message = forumWriteLimitError({
      lastDay: Number(counts?.lastDay ?? 0),
      lastMinute: Number(counts?.lastMinute ?? 0),
    })
    if (!message) {
      await db.insert(aiUsageEvents).values({ userId, kind: FORUM_WRITE_USAGE_KIND })
    }
  } catch (err) {
    // The in-memory check above still applies while the usage table is unreachable.
    console.warn('[assertForumWriteLimit] Usage check unavailable:', err)
  }

  if (message) throw new Error(message)
}
