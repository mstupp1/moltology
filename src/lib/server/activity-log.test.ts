import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  deleteRoutineCompletedEvent,
  listActivityEventsForUser,
  recordRoutineCompletedEvent,
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
  const from = vi.fn().mockReturnValue({ where: whereSelect })
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
      })
    )
    expect(mock.onConflictDoNothing).toHaveBeenCalled()
  })

  it('ignores unknown liturgy keys instead of inventing copy', async () => {
    const mock = createMockDb()
    await recordRoutineCompletedEvent(mock.db, 'user-1', 'not-a-real-task', '2026-08-27')
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
    expect(mock.limit).toHaveBeenCalledWith(8)
  })

  it('maps stored rows into stream views', async () => {
    const mock = createMockDb([
      {
        id: 'evt-1',
        kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
        title: 'Silent Synchronization sealed',
        detail: 'The 05:30 liturgy is complete.',
        valueBadge: '05:30',
        createdAt: new Date('2026-08-27T17:46:00.000Z'),
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
  })
})
