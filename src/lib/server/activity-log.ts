import { and, desc, eq, inArray, like, lt, or } from 'drizzle-orm'
import { activityEvents, friendships, profiles, type ActivityEventMetadata } from '../../db/schema'
import { getDb } from '../../db'
import { CANONICAL_ALIGNMENT_TASKS, TOTAL_ALIGNMENT_TASKS } from '../alignment-tasks'
import {
  ACTIVITY_EVENT_KIND_DAY_ALIGNED,
  ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
  ACTIVITY_EVENT_KIND_STAGE_REACHED,
  ACTIVITY_EVENT_KIND_STREAK_MILESTONE,
  buildDayAlignedCopy,
  buildRoutineCompletedCopy,
  buildStageReachedCopy,
  buildStreakMilestoneCopy,
  dayAlignedSourceKey,
  decodeActivityCursor,
  encodeActivityCursor,
  kindsForActivityFilter,
  resolveActivityKindMeta,
  routineActivitySourceKey,
  stageReachedSourceKey,
  streakMilestoneSourceKey,
  toActivityEventView,
  type ActivityEventView,
  type ActivityFeedFilter,
  type ActivityFeedPage,
  type ActivityFeedScope,
  type ActivityVisibility,
} from '../activity-events'

type Db = ReturnType<typeof getDb>

const DEFAULT_STREAM_LIMIT = 8
const DEFAULT_FEED_LIMIT = 20
const MAX_FEED_LIMIT = 50

export interface ActivityFeedQuery {
  scope?: ActivityFeedScope
  filter?: ActivityFeedFilter
  limit?: number
  cursor?: string | null
}

async function listFriendIdsForUser(dbClient: Db, userId: string): Promise<string[]> {
  const rows = await dbClient
    .select({
      userAId: friendships.userAId,
      userBId: friendships.userBId,
    })
    .from(friendships)
    .where(or(eq(friendships.userAId, userId), eq(friendships.userBId, userId)))

  return (rows || []).map((row) => (row.userAId === userId ? row.userBId : row.userAId))
}

async function insertActivityEvent(
  dbClient: Db,
  values: {
    userId: string
    kind: string
    title: string
    detail: string
    valueBadge?: string | null
    sourceKey: string
    visibility?: ActivityVisibility
    metadata?: ActivityEventMetadata
    href?: string | null
  }
): Promise<void> {
  const meta = resolveActivityKindMeta(values.kind)
  await dbClient
    .insert(activityEvents)
    .values({
      userId: values.userId,
      kind: values.kind,
      title: values.title,
      detail: values.detail,
      valueBadge: values.valueBadge ?? null,
      sourceKey: values.sourceKey,
      visibility: values.visibility ?? meta.defaultVisibility,
      metadata: values.metadata ?? {},
      href: values.href ?? null,
    })
    .onConflictDoNothing()
}

export async function recordRoutineCompletedEvent(
  dbClient: Db,
  userId: string,
  taskKey: string,
  date: string
): Promise<void> {
  const task = CANONICAL_ALIGNMENT_TASKS.find((item) => item.key === taskKey)
  if (!task) return
  const copy = buildRoutineCompletedCopy(task)
  await insertActivityEvent(dbClient, {
    userId,
    kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
    title: copy.title,
    detail: copy.detail,
    valueBadge: copy.valueBadge,
    sourceKey: routineActivitySourceKey(taskKey, date),
    metadata: {
      taskKey,
      taskTitle: task.title,
      time: task.time,
      date,
    },
    href: '/dashboard',
  })
}

export async function recordDayAlignedEvent(
  dbClient: Db,
  userId: string,
  date: string,
  completedCount = TOTAL_ALIGNMENT_TASKS,
  totalCount = TOTAL_ALIGNMENT_TASKS
): Promise<void> {
  const copy = buildDayAlignedCopy(completedCount, totalCount)
  await insertActivityEvent(dbClient, {
    userId,
    kind: ACTIVITY_EVENT_KIND_DAY_ALIGNED,
    title: copy.title,
    detail: copy.detail,
    valueBadge: copy.valueBadge,
    sourceKey: dayAlignedSourceKey(date),
    metadata: {
      date,
      completedCount,
      totalCount,
    },
    href: '/dashboard',
  })
}

export async function recordStreakMilestoneEvent(
  dbClient: Db,
  userId: string,
  date: string,
  streakDays: number,
  bonusXp = 0
): Promise<void> {
  if (streakDays <= 0) return
  const copy = buildStreakMilestoneCopy(streakDays)
  await insertActivityEvent(dbClient, {
    userId,
    kind: ACTIVITY_EVENT_KIND_STREAK_MILESTONE,
    title: copy.title,
    detail: copy.detail,
    valueBadge: copy.valueBadge,
    sourceKey: streakMilestoneSourceKey(streakDays, date),
    metadata: {
      date,
      streakDays,
      bonusXp,
    },
    href: '/dashboard',
  })
}

export async function recordStageReachedEvent(
  dbClient: Db,
  userId: string,
  stage: number,
  previousStage?: number
): Promise<void> {
  if (stage <= 1) return
  const copy = buildStageReachedCopy(stage)
  await insertActivityEvent(dbClient, {
    userId,
    kind: ACTIVITY_EVENT_KIND_STAGE_REACHED,
    title: copy.title,
    detail: copy.detail,
    valueBadge: copy.valueBadge,
    sourceKey: stageReachedSourceKey(stage),
    metadata: {
      stage,
      previousStage,
      stageTitle: copy.title.replace(/^Reached\s+/, ''),
    },
    href: '/pipeline',
  })
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
        or(
          eq(activityEvents.sourceKey, routineActivitySourceKey(taskKey, date)),
          eq(activityEvents.sourceKey, dayAlignedSourceKey(date)),
          like(activityEvents.sourceKey, `streak:%:${date}`)
        )
      )
    )
}

export async function listActivityFeed(
  dbClient: Db,
  viewerId: string,
  query: ActivityFeedQuery = {},
  now = new Date()
): Promise<ActivityFeedPage> {
  const scope: ActivityFeedScope = query.scope === 'self' ? 'self' : 'circle'
  const filter: ActivityFeedFilter = query.filter ?? 'all'
  const limit = Math.min(Math.max(query.limit ?? DEFAULT_FEED_LIMIT, 1), MAX_FEED_LIMIT)
  const kindFilter = kindsForActivityFilter(filter)
  const cursor = query.cursor ? decodeActivityCursor(query.cursor) : null

  let audienceIds = [viewerId]
  if (scope === 'circle') {
    const friendIds = await listFriendIdsForUser(dbClient, viewerId)
    audienceIds = [viewerId, ...friendIds]
  }

  const conditions = [inArray(activityEvents.userId, audienceIds)]

  if (scope === 'circle') {
    conditions.push(
      or(
        eq(activityEvents.userId, viewerId),
        inArray(activityEvents.visibility, ['friends', 'public'])
      )!
    )
  }

  if (kindFilter && kindFilter.length > 0) {
    conditions.push(inArray(activityEvents.kind, kindFilter))
  }

  if (cursor) {
    const cursorDate = new Date(cursor.createdAt)
    conditions.push(
      or(
        lt(activityEvents.createdAt, cursorDate),
        and(eq(activityEvents.createdAt, cursorDate), lt(activityEvents.id, cursor.id))
      )!
    )
  }

  const records = await dbClient
    .select({
      id: activityEvents.id,
      userId: activityEvents.userId,
      kind: activityEvents.kind,
      title: activityEvents.title,
      detail: activityEvents.detail,
      valueBadge: activityEvents.valueBadge,
      visibility: activityEvents.visibility,
      href: activityEvents.href,
      metadata: activityEvents.metadata,
      createdAt: activityEvents.createdAt,
      actorHandle: profiles.handle,
      actorLarvaId: profiles.larvaId,
      actorStage: profiles.stage,
      actorAvatarConfig: profiles.avatarConfig,
    })
    .from(activityEvents)
    .innerJoin(profiles, eq(activityEvents.userId, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(activityEvents.createdAt), desc(activityEvents.id))
    .limit(limit + 1)

  const rows = records || []
  const hasMore = rows.length > limit
  const pageRows = hasMore ? rows.slice(0, limit) : rows
  const events = pageRows.map((row) => toActivityEventView(row, now, viewerId))
  const last = pageRows[pageRows.length - 1]
  const nextCursor =
    hasMore && last
      ? encodeActivityCursor(
          (last.createdAt instanceof Date ? last.createdAt : new Date(last.createdAt)).toISOString(),
          last.id
        )
      : null

  return { events, nextCursor }
}

export async function listActivityEventsForUser(
  dbClient: Db,
  userId: string,
  limit = DEFAULT_STREAM_LIMIT,
  now = new Date()
): Promise<ActivityEventView[]> {
  const page = await listActivityFeed(
    dbClient,
    userId,
    { scope: 'self', filter: 'all', limit },
    now
  )
  return page.events
}
