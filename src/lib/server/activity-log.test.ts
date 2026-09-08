import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  deleteRoutineCompletedEvent,
  listActivityEventsForUser,
  listActivityFeed,
  recordDayAlignedEvent,
  recordRoutineCompletedEvent,
  recordStageReachedEvent,
  recordStreakMilestoneEvent,
} from './activity-log'
import { ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED } from '../activity-events'

function createMockDb(rows: unknown[] = []) {
  const onConflictDoNothing = vi.fn().mockResolvedValue([])
  const values = vi.fn().mockReturnValue({ onConflictDoNothing })
  const insert = vi.fn().mockReturnValue({ values })
  const whereDelete = vi.fn().mockResolvedValue([])
  const deleteFn = vi.fn().mockReturnValue({ where: whereDelete })
  const limit = vi.fn().mockResolvedValue(rows)
  const orderBy = vi.fn().mockReturnValue({ limit })
  const whereSelect = vi.fn().mockReturnValue({ orderBy })
  const innerJoin = vi.fn().mockReturnValue({ where: whereSelect })
  const from = vi.fn().mockReturnValue({ where: whereSelect, innerJoin })
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
    whereSelect,
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
        href: '/dashboard',
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
})
