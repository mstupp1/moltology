import { describe, expect, it, vi } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getBlogCommentsHandler } from './db-services'

const MEMBER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

describe('getBlogCommentsHandler public names', () => {
  it('prefers a claimed designation over the stored larva unit', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  id: 'c1',
                  postId: 'p1',
                  userId: MEMBER_A,
                  authorName: 'LARVA UNIT #2468',
                  authorAvatar: '/images/stage1_larva.png',
                  content: 'The molt holds.',
                  createdAt: new Date('2026-09-03T00:00:00.000Z'),
                  profileStage: 2,
                  profileHandle: 'claw_lord',
                  profileLarvaId: 'LARVA UNIT #2468',
                },
              ]),
            }),
          }),
        }),
      }),
    }

    const comments = await getBlogCommentsHandler({
      data: 'p1',
      context: { db: mockDb as any },
    })

    expect(comments[0]?.authorName).toBe('claw_lord')
    expect(comments[0]?.authorName).not.toMatch(/LARVA UNIT/)
  })

  it('keeps the larva unit when the member never claimed a designation', async () => {
    const mockDb = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([
                {
                  id: 'c2',
                  postId: 'p1',
                  userId: MEMBER_A,
                  authorName: 'LARVA UNIT #2468',
                  authorAvatar: '/images/stage1_larva.png',
                  content: 'Still larval.',
                  createdAt: new Date('2026-09-03T00:00:00.000Z'),
                  profileStage: 1,
                  profileHandle: null,
                  profileLarvaId: 'LARVA UNIT #2468',
                },
              ]),
            }),
          }),
        }),
      }),
    }

    const comments = await getBlogCommentsHandler({
      data: 'p1',
      context: { db: mockDb as any },
    })

    expect(comments[0]?.authorName).toBe('LARVA UNIT #2468')
  })
})
