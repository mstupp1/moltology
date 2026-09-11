import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getActivityEventsHandler, getActivityFeedHandler } from './db-services'

function createFeedDb(rows: unknown[] = []) {
  const where = vi.fn().mockReturnValue({
    orderBy: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(rows),
    }),
  })
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where,
        innerJoin: vi.fn().mockReturnValue({ where }),
      }),
    }),
  }
}

describe('getActivityEventsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty stream for an unauthenticated caller', async () => {
    const events = await getActivityEventsHandler({ data: {}, context: {} })
    expect(events).toEqual([])
  })

  it('returns an empty stream when the member has no stored events', async () => {
    const events = await getActivityEventsHandler({
      data: {},
      context: {
        user: { sub: 'empty-member' },
        db: createFeedDb([]) as any,
      },
    })

    expect(events).toEqual([])
  })

  it('returns that member’s liturgy events and never canned veteran proof', async () => {
    const events = await getActivityEventsHandler({
      data: {},
      context: {
        user: { sub: 'real-member' },
        db: createFeedDb([
          {
            id: 'evt-1',
            userId: 'real-member',
            kind: 'routine_completed',
            title: 'Silent Synchronization sealed',
            detail: 'The 05:30 liturgy is complete.',
            valueBadge: '05:30',
            createdAt: new Date('2026-08-27T17:46:00.000Z'),
            actorHandle: 'claw_lord',
            actorLarvaId: 'LARVA UNIT #1',
            actorStage: 1,
            actorAvatarConfig: null,
          },
        ]) as any,
      },
    })

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Silent Synchronization sealed')
    expect(events[0].actor.displayName).toBe('claw_lord')
    expect(JSON.stringify(events)).not.toMatch(/luxury sedan/i)
    expect(JSON.stringify(events)).not.toMatch(/\+450/)
    expect(JSON.stringify(events)).not.toMatch(/3,?400/)
  })
})

describe('getActivityFeedHandler', () => {
  it('returns an empty page for an unauthenticated caller', async () => {
    const page = await getActivityFeedHandler({ data: {}, context: {} })
    expect(page).toEqual({ events: [], nextCursor: null })
  })

  it('accepts the community filter and stays empty-honest when nothing is stored', async () => {
    const page = await getActivityFeedHandler({
      data: { scope: 'circle', filter: 'community' },
      context: {
        user: { sub: 'empty-member' },
        db: createFeedDb([]) as any,
      },
    })
    expect(page).toEqual({ events: [], nextCursor: null })
  })

  it('returns a page of circle events with a cursor when asked', async () => {
    const page = await getActivityFeedHandler({
      data: { scope: 'self', filter: 'all', limit: 1 },
      context: {
        user: { sub: 'real-member' },
        db: createFeedDb([
          {
            id: 'evt-1',
            userId: 'real-member',
            kind: 'streak_milestone',
            title: '7-day streak',
            detail: 'Held for 7 consecutive days.',
            valueBadge: '7d',
            createdAt: new Date('2026-08-27T17:46:00.000Z'),
            actorHandle: 'claw_lord',
            actorLarvaId: 'LARVA UNIT #1',
            actorStage: 2,
            actorAvatarConfig: null,
          },
          {
            id: 'evt-2',
            userId: 'real-member',
            kind: 'routine_completed',
            title: 'Silent Synchronization sealed',
            detail: 'The 05:30 liturgy is complete.',
            valueBadge: '05:30',
            createdAt: new Date('2026-08-27T17:40:00.000Z'),
            actorHandle: 'claw_lord',
            actorLarvaId: 'LARVA UNIT #1',
            actorStage: 2,
            actorAvatarConfig: null,
          },
        ]) as any,
      },
    })

    expect(page.events).toHaveLength(1)
    expect(page.events[0].title).toBe('7-day streak')
    expect(page.nextCursor).toBe('2026-08-27T17:46:00.000Z|evt-1')
  })
})
