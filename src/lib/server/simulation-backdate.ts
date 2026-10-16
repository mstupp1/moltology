import { and, gte, inArray, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import {
  activityEvents,
  forumPosts,
  forumTopics,
  forumVotes,
  friendships,
  memberBonds,
  notifications,
  profiles,
} from '../../db/schema'

type DbClient = ReturnType<typeof getDb>

/**
 * Move everything a simulated tick just wrote back in time so it lands at `at`.
 *
 * The engine writes rows with the database default (`now`). After a tick commits, rows
 * created since `since` that belong to simulated members are shifted back by
 * `finishedAt - at`, which keeps their order and puts the whole tick at or before `at`.
 * Real members' rows are never touched: every table is filtered by simulated user ids.
 */
export async function backdateSimulationTick(
  dbClient: DbClient,
  input: { since: Date; at: Date; finishedAt?: Date; simulatedIds: string[] }
) {
  const finishedAt = input.finishedAt ?? new Date()
  const shiftMs = finishedAt.getTime() - input.at.getTime()
  if (shiftMs <= 0 || input.simulatedIds.length === 0) return { shiftedMs: 0 }

  const shift = sql`make_interval(secs => ${shiftMs / 1000})`
  const ids = input.simulatedIds
  const since = input.since

  await dbClient
    .update(forumTopics)
    .set({
      createdAt: sql`${forumTopics.createdAt} - ${shift}`,
      lastReplyAt: sql`${forumTopics.lastReplyAt} - ${shift}`,
    })
    .where(and(gte(forumTopics.createdAt, since), inArray(forumTopics.userId, ids)))

  // Existing threads that simulated members replied to during the tick.
  await dbClient
    .update(forumTopics)
    .set({ lastReplyAt: sql`${forumTopics.lastReplyAt} - ${shift}` })
    .where(
      and(
        gte(forumTopics.lastReplyAt, since),
        sql`${forumTopics.createdAt} < ${since}`,
        sql`exists (select 1 from ${forumPosts} where ${forumPosts.topicId} = ${forumTopics.id} and ${forumPosts.createdAt} >= ${since} and ${inArray(forumPosts.userId, ids)})`
      )
    )

  await dbClient
    .update(forumPosts)
    .set({ createdAt: sql`${forumPosts.createdAt} - ${shift}` })
    .where(and(gte(forumPosts.createdAt, since), inArray(forumPosts.userId, ids)))

  await dbClient
    .update(forumVotes)
    .set({ createdAt: sql`${forumVotes.createdAt} - ${shift}` })
    .where(and(gte(forumVotes.createdAt, since), inArray(forumVotes.userId, ids)))

  await dbClient
    .update(activityEvents)
    .set({ createdAt: sql`${activityEvents.createdAt} - ${shift}` })
    .where(and(gte(activityEvents.createdAt, since), inArray(activityEvents.userId, ids)))

  await dbClient
    .update(notifications)
    .set({ createdAt: sql`${notifications.createdAt} - ${shift}` })
    .where(and(gte(notifications.createdAt, since), inArray(notifications.actorUserId, ids)))

  await dbClient
    .update(friendships)
    .set({ createdAt: sql`${friendships.createdAt} - ${shift}` })
    .where(and(gte(friendships.createdAt, since), inArray(friendships.userAId, ids), inArray(friendships.userBId, ids)))

  await dbClient
    .update(memberBonds)
    .set({ createdAt: sql`${memberBonds.createdAt} - ${shift}` })
    .where(and(gte(memberBonds.createdAt, since), inArray(memberBonds.fromUserId, ids)))

  // Newly spawned acolytes: backdate the join date too.
  await dbClient
    .update(profiles)
    .set({ createdAt: sql`${profiles.createdAt} - ${shift}` })
    .where(and(gte(profiles.createdAt, since), inArray(profiles.id, ids)))

  return { shiftedMs: shiftMs }
}
