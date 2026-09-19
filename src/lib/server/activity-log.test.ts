import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  deleteRoutineCompletedEvent,
  listActivityEventsForUser,
  listActivityFeed,
  maybeRecordOracleConsultationMilestone,
  recordConnectionAcceptedEvent,
  recordConnectionAcceptedEvents,
  recordDayAlignedEvent,
  recordForumReplyPostedEvent,
  recordForumTopicOpenedEvent,
  recordOracleConsultationMilestone,
  recordRoutineCompletedEvent,
  recordStageReachedEvent,
  recordStreakMilestoneEvent,
} from './activity-log'
import {
  ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED,
  ACTIVITY_EVENT_KIND_FORUM_REPLY_POSTED,
  ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED,
  ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
  ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
} from '../activity-events'

function createMockDb(rows: unknown[] = [], friendRows: unknown[] = []) {
  const onConflictDoNothing = vi.fn().mockResolvedValue([])
  const values = vi.fn().mockReturnValue({ onConflictDoNothing })
  const insert = vi.fn().mockReturnValue({ values })
  const whereDelete = vi.fn().mockResolvedValue([])
  const deleteFn = vi.fn().mockReturnValue({ where: whereDelete })
  const limit = vi.fn().mockResolvedValue(rows)
  const orderBy = vi.fn().mockReturnValue({ limit })
  const feedWhere = vi.fn().mockReturnValue({ orderBy })
  const innerJoin = vi.fn().mockReturnValue({ where: feedWhere })
  const friendWhere = vi.fn().mockResolvedValue(friendRows)
  const from = vi.fn().mockReturnValue({ where: friendWhere, innerJoin })
  const select = vi.fn().mockReturnValue({ from })

  return {
    db: { insert, delete: deleteFn, select } as any,
    insert,
    values,
    onConflictDoNothing,
    deleteFn,
    whereDelete,
    select,
    from,
    innerJoin,
    friendWhere,
    feedWhere,
    orderBy,
    limit,
  }
}

describe('activity event log helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records a liturgy completion against the member id and source key', async () => {
    const mock = createMockDb()
    await recordRoutineCompletedEvent(mock.db, 'user-1', 'silent-synchronization', '2026-08-27')
    expect(mock.insert).toHaveBeenCalledTimes(1)
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
        title: 'Silent Synchronization sealed',
        detail: 'The 05:30 liturgy is complete.',
        valueBadge: '05:30',
        sourceKey: 'routine:silent-synchronization:2026-08-27',
        visibility: 'friends',
        href: '/dashboard#daily-routine-hub',
      })
    )
    expect(mock.onConflictDoNothing).toHaveBeenCalled()
  })

  it('records day aligned, streak, and stage highlight events', async () => {
    const mock = createMockDb()
    await recordDayAlignedEvent(mock.db, 'user-1', '2026-08-27', 8, 8)
    await recordStreakMilestoneEvent(mock.db, 'user-1', '2026-08-27', 7, 150)
    await recordStageReachedEvent(mock.db, 'user-1', 2, 1)
    expect(mock.insert).toHaveBeenCalledTimes(3)
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'day_aligned', sourceKey: 'day_aligned:2026-08-27' })
    )
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'streak_milestone', sourceKey: 'streak:7:2026-08-27' })
    )
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'stage_reached', sourceKey: 'stage:2', href: '/pipeline' })
    )
  })

  it('ignores unknown liturgy keys instead of inventing copy', async () => {
    const mock = createMockDb()
    await recordRoutineCompletedEvent(mock.db, 'user-1', 'not-a-real-task', '2026-08-27')
    expect(mock.insert).not.toHaveBeenCalled()
  })

  it('skips larval stage events', async () => {
    const mock = createMockDb()
    await recordStageReachedEvent(mock.db, 'user-1', 1)
    expect(mock.insert).not.toHaveBeenCalled()
  })

  it('records a connection pulse for each member without inventing a second network', async () => {
    const mock = createMockDb()
    await recordConnectionAcceptedEvents(
      mock.db,
      { id: 'user-1', handle: 'claw_lord', larvaId: 'LARVA UNIT #1' },
      { id: 'user-2', handle: 'shell_sib', larvaId: 'LARVA UNIT #2' }
    )
    expect(mock.insert).toHaveBeenCalledTimes(2)
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        kind: ACTIVITY_EVENT_KIND_CONNECTION_ACCEPTED,
        title: 'Circle widened',
        detail: 'Connected with shell_sib.',
        sourceKey: 'connection:user-1:user-2',
        href: '/member/shell_sib',
        visibility: 'friends',
      })
    )
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        detail: 'Connected with claw_lord.',
        href: '/member/claw_lord',
      })
    )
  })

  it('ignores a self-connection instead of writing a pulse', async () => {
    const mock = createMockDb()
    await recordConnectionAcceptedEvent(mock.db, 'user-1', { id: 'user-1', handle: 'claw_lord' })
    expect(mock.insert).not.toHaveBeenCalled()
  })

  it('records a community thread pulse with a board href', async () => {
    const mock = createMockDb()
    await recordForumTopicOpenedEvent(mock.db, 'user-1', {
      id: 'topic-1',
      title: 'Hold the quiet',
      slug: 'hold-the-quiet',
      categorySlug: 'general-discussion',
      categoryName: 'General Discussion',
      mentionedHandles: ['shell_sib'],
    })
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: ACTIVITY_EVENT_KIND_FORUM_TOPIC_OPENED,
        title: 'Hold the quiet',
        detail: 'Opened a thread on General Discussion.',
        sourceKey: 'forum_topic:topic-1',
        href: '/forum/general-discussion/hold-the-quiet',
        visibility: 'friends',
        metadata: expect.objectContaining({ mentionedHandles: ['shell_sib'] }),
      })
    )
  })

  it('records a friend reply pulse with a thread anchor and does not invent inbox copy', async () => {
    const mock = createMockDb()
    await recordForumReplyPostedEvent(mock.db, 'user-1', {
      postId: 'post-1',
      topicId: 'topic-1',
      topicTitle: 'Hold the quiet',
      topicSlug: 'hold-the-quiet',
      categorySlug: 'general-discussion',
      categoryName: 'General Discussion',
      mentionedHandles: ['shell_sib'],
    })
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: ACTIVITY_EVENT_KIND_FORUM_REPLY_POSTED,
        title: 'Hold the quiet',
        detail: 'Replied on General Discussion.',
        sourceKey: 'forum_reply_posted:post-1',
        href: '/forum/general-discussion/hold-the-quiet#post-post-1',
        visibility: 'friends',
        metadata: expect.objectContaining({
          postId: 'post-1',
          mentionedHandles: ['shell_sib'],
        }),
      })
    )
    expect(mock.values).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'forum_reply' })
    )
    expect(mock.values).not.toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'forum_mention' })
    )
  })

  it('records oracle milestones only at real consultation counts', async () => {
    const mock = createMockDb()
    await recordOracleConsultationMilestone(mock.db, 'user-1', 3, 'thread-3')
    expect(mock.insert).not.toHaveBeenCalled()
    await recordOracleConsultationMilestone(mock.db, 'user-1', 1, 'thread-1')
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
        title: 'First consultation',
        sourceKey: 'oracle:1',
        href: '/oracle',
        metadata: { consultationCount: 1, threadId: 'thread-1' },
      })
    )
  })

  it('skips oracle pulses when the thread count cannot be read', async () => {
    const mock = createMockDb()
    await maybeRecordOracleConsultationMilestone(mock.db, 'user-1', 'thread-1')
    expect(mock.insert).not.toHaveBeenCalled()
  })

  it('records the first consultation when one oracle thread already exists', async () => {
    const mock = createMockDb()
    mock.friendWhere.mockResolvedValueOnce([{ id: 'thread-1' }])
    await maybeRecordOracleConsultationMilestone(mock.db, 'user-1', 'thread-1')
    expect(mock.values).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: ACTIVITY_EVENT_KIND_ORACLE_MILESTONE,
        sourceKey: 'oracle:1',
        href: '/oracle',
      })
    )
  })

  it('deletes the matching liturgy event when a completion is undone', async () => {
    const mock = createMockDb()
    await deleteRoutineCompletedEvent(mock.db, 'user-1', 'silent-synchronization', '2026-08-27')
    expect(mock.deleteFn).toHaveBeenCalledTimes(1)
    expect(mock.whereDelete).toHaveBeenCalled()
  })

  it('returns an empty list when the member has no events', async () => {
    const mock = createMockDb([])
    const events = await listActivityEventsForUser(mock.db, 'user-1', 8, new Date('2026-08-27T18:00:00.000Z'))
    expect(events).toEqual([])
    expect(mock.innerJoin).toHaveBeenCalled()
    expect(mock.limit).toHaveBeenCalledWith(9)
  })

  it('maps stored rows into stream views', async () => {
    const mock = createMockDb([
      {
        id: 'evt-1',
        userId: 'user-1',
        kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
        title: 'Silent Synchronization sealed',
        detail: 'The 05:30 liturgy is complete.',
        valueBadge: '05:30',
        createdAt: new Date('2026-08-27T17:46:00.000Z'),
        actorHandle: 'claw_lord',
        actorLarvaId: 'LARVA UNIT #1',
        actorStage: 1,
        actorAvatarConfig: null,
      },
    ])
    const events = await listActivityEventsForUser(
      mock.db,
      'user-1',
      8,
      new Date('2026-08-27T18:00:00.000Z')
    )
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Silent Synchronization sealed')
    expect(events[0].occurredLabel).toBe('14 minutes ago')
    expect(events[0].actor.displayName).toBe('claw_lord')
  })

  it('exposes a next cursor when the page is full', async () => {
    const rows = Array.from({ length: 3 }, (_, i) => ({
      id: `evt-${i}`,
      userId: 'user-1',
      kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
      title: `Event ${i}`,
      detail: 'detail',
      valueBadge: null,
      createdAt: new Date('2026-08-27T17:46:00.000Z'),
      actorHandle: null,
      actorLarvaId: 'LARVA UNIT #1',
      actorStage: 1,
      actorAvatarConfig: null,
    }))
    const mock = createMockDb(rows)
    const page = await listActivityFeed(
      mock.db,
      'user-1',
      { scope: 'self', filter: 'all', limit: 2 },
      new Date('2026-08-27T18:00:00.000Z')
    )
    expect(page.events).toHaveLength(2)
    expect(page.nextCursor).toBe('2026-08-27T17:46:00.000Z|evt-1')
  })

  it('returns an empty circle when the member has no accepted friends', async () => {
    const mock = createMockDb([
      {
        id: 'evt-own',
        userId: 'user-1',
        kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
        title: 'Silent Synchronization sealed',
        detail: 'The 05:30 liturgy is complete.',
        valueBadge: '05:30',
        createdAt: new Date('2026-08-27T17:46:00.000Z'),
        actorHandle: 'claw_lord',
        actorLarvaId: 'LARVA UNIT #1',
        actorStage: 1,
        actorAvatarConfig: null,
      },
    ])
    const page = await listActivityFeed(
      mock.db,
      'user-1',
      { scope: 'circle', filter: 'all', limit: 8 },
      new Date('2026-08-27T18:00:00.000Z')
    )
    expect(page).toEqual({ events: [], nextCursor: null })
    expect(mock.innerJoin).not.toHaveBeenCalled()
  })

  it('lists accepted-friend pulses on Circle and never the viewer’s own rows', async () => {
    const mock = createMockDb(
      [
        {
          id: 'evt-friend',
          userId: 'friend-1',
          kind: ACTIVITY_EVENT_KIND_FORUM_REPLY_POSTED,
          title: 'Hold the quiet',
          detail: 'Replied on General Discussion.',
          valueBadge: 'Reply',
          href: '/forum/general-discussion/hold-the-quiet#post-1',
          createdAt: new Date('2026-08-27T17:46:00.000Z'),
          actorHandle: 'shell_sib',
          actorLarvaId: 'LARVA UNIT #2',
          actorStage: 2,
          actorAvatarConfig: null,
        },
      ],
      [{ userAId: 'user-1', userBId: 'friend-1' }]
    )
    const page = await listActivityFeed(
      mock.db,
      'user-1',
      { scope: 'circle', filter: 'all', limit: 8 },
      new Date('2026-08-27T18:00:00.000Z')
    )
    expect(page.events).toHaveLength(1)
    expect(page.events[0].actor.displayName).toBe('shell_sib')
    expect(page.events[0].isOwn).toBe(false)
    expect(mock.innerJoin).toHaveBeenCalled()
  })
})
