import { and, desc, eq } from 'drizzle-orm'
import { activityEvents } from '../../db/schema'
import { getDb } from '../../db'
import { CANONICAL_ALIGNMENT_TASKS } from '../alignment-tasks'
import {
  ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
  buildRoutineCompletedCopy,
  routineActivitySourceKey,
  toActivityEventView,
  type ActivityEventView,
} from '../activity-events'

type Db = ReturnType<typeof getDb>

const DEFAULT_STREAM_LIMIT = 8

export async function recordRoutineCompletedEvent(
  dbClient: Db,
  userId: string,
  taskKey: string,
  date: string
): Promise<void> {
  const task = CANONICAL_ALIGNMENT_TASKS.find((item) => item.key === taskKey)
  if (!task) return
  const copy = buildRoutineCompletedCopy(task)
  await dbClient
    .insert(activityEvents)
    .values({
      userId,
      kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
      title: copy.title,
      detail: copy.detail,
      valueBadge: copy.valueBadge,
      sourceKey: routineActivitySourceKey(taskKey, date),
    })
    .onConflictDoNothing()
}

export async function deleteRoutineCompletedEvent(
  dbClient: Db,
  userId: string,
  taskKey: string,
  date: string
): Promise<void> {
  await dbClient
    .delete(activityEvents)
    .where(
      and(
        eq(activityEvents.userId, userId),
        eq(activityEvents.sourceKey, routineActivitySourceKey(taskKey, date))
      )
    )
}

export async function listActivityEventsForUser(
  dbClient: Db,
  userId: string,
  limit = DEFAULT_STREAM_LIMIT,
  now = new Date()
): Promise<ActivityEventView[]> {
  const records = await dbClient
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.userId, userId))
    .orderBy(desc(activityEvents.createdAt))
    .limit(limit)

  return (records || []).map((row) => toActivityEventView(row, now))
}
