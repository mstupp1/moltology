import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getActivityEventsHandler } from './api'

describe('getActivityEventsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an empty stream for an unauthenticated caller', async () => {
    const events = await getActivityEventsHandler({ data: {}, context: {} })
    expect(events).toEqual([])
  })

  it('returns an empty stream when the member has no stored events', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    }

    const events = await getActivityEventsHandler({
      data: {},
      context: {
        user: { sub: 'empty-member' },
        db: mockDb as any,
      },
    })

    expect(events).toEqual([])
  })

  it('returns that member’s liturgy events and never canned veteran proof', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: 'evt-1',
                  kind: 'routine_completed',
                  title: 'Silent Synchronization sealed',
                  detail: 'The 05:30 liturgy is complete.',
                  valueBadge: '05:30',
                  createdAt: new Date('2026-08-27T17:46:00.000Z'),
                },
              ]),
            }),
          }),
        }),
      }),
    }

    const events = await getActivityEventsHandler({
      data: {},
      context: {
        user: { sub: 'real-member' },
        db: mockDb as any,
      },
    })

    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Silent Synchronization sealed')
    expect(JSON.stringify(events)).not.toMatch(/luxury sedan/i)
    expect(JSON.stringify(events)).not.toMatch(/\+450/)
    expect(JSON.stringify(events)).not.toMatch(/3,?400/)
  })
})
