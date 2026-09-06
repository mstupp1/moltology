import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getNotificationsHandler, markNotificationReadHandler } from './db-services'

const viewerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const actorId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

describe('notification inbox handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists hail and reply rows for the signed-in member', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue([
                  {
                    id: '11111111-1111-4111-8111-111111111111',
                    kind: 'forum_mention',
                    title: 'You were hailed',
                    detail: 'LARVA UNIT #9 hailed you in a discussion.',
                    actorUserId: actorId,
                    payload: {
                      topicId: 'topic-1',
                      postId: 'post-hail',
                      categorySlug: 'general-discussion',
                      topicSlug: 'molt-notes',
                    },
                    readAt: null,
                    createdAt: new Date('2026-09-06T01:00:00.000Z'),
                    actorLarvaId: 'LARVA UNIT #9',
                    actorHandle: 'claw_lord',
                  },
                  {
                    id: '22222222-2222-4222-8222-222222222222',
                    kind: 'forum_reply',
                    title: 'A reply reached your thread',
                    detail: 'LARVA UNIT #9 answered a thread you opened.',
                    actorUserId: actorId,
                    payload: {
                      topicId: 'topic-1',
                      postId: 'post-reply',
                      categorySlug: 'general-discussion',
                      topicSlug: 'molt-notes',
                      replyTarget: 'topic',
                    },
                    readAt: new Date('2026-09-06T01:05:00.000Z'),
                    createdAt: new Date('2026-09-06T00:00:00.000Z'),
                    actorLarvaId: 'LARVA UNIT #9',
                    actorHandle: 'pincer_prime',
                  },
                ]),
              }),
            }),
          }),
        }),
      }),
    }

    const result = await getNotificationsHandler({
      data: { userId: viewerId },
      context: {
        user: { sub: viewerId },
        db: mockDb as any,
      },
    })

    expect(result.unreadCount).toBe(1)
    expect(result.notifications).toHaveLength(2)
    expect(result.notifications[0]).toEqual(
      expect.objectContaining({
        kind: 'forum_mention',
        title: 'You were hailed',
        detail: 'claw_lord hailed you in a discussion.',
        readAt: null,
      }),
    )
    expect(result.notifications[1]).toEqual(
      expect.objectContaining({
        kind: 'forum_reply',
        title: 'A reply reached your thread',
        detail: 'pincer_prime answered a thread you opened.',
        readAt: '2026-09-06T01:05:00.000Z',
      }),
    )
  })

  it('marks a single notification read for the owner', async () => {
    const setValues: Record<string, unknown>[] = []
    const mockDb = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          setValues.push(values)
          return {
            where: vi.fn().mockResolvedValue([]),
          }
        }),
      }),
    }

    const result = await markNotificationReadHandler({
      data: { notificationId: '11111111-1111-4111-8111-111111111111' },
      context: {
        user: { sub: viewerId },
        db: mockDb as any,
      },
    })

    expect(result).toEqual({ ok: true })
    expect(setValues[0]?.readAt).toBeInstanceOf(Date)
    expect(mockDb.update).toHaveBeenCalledTimes(1)
  })

  it('marks the whole inbox read when all is set', async () => {
    const setValues: Record<string, unknown>[] = []
    const mockDb = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          setValues.push(values)
          return {
            where: vi.fn().mockResolvedValue([]),
          }
        }),
      }),
    }

    const result = await markNotificationReadHandler({
      data: { all: true },
      context: {
        user: { sub: viewerId },
        db: mockDb as any,
      },
    })

    expect(result).toEqual({ ok: true })
    expect(setValues[0]?.readAt).toBeInstanceOf(Date)
  })
})
