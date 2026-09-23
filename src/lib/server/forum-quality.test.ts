import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createForumTopicHandler, getForumTopicsHandler } from './db-services'
import {
  FORUM_QUARANTINE_ERROR,
  fallbackForumDecision,
  screenForumSubmission,
} from '../quality/forum-gate'

vi.mock('../quality/forum-gate', async () => {
  const actual = await vi.importActual<typeof import('../quality/forum-gate')>('../quality/forum-gate')
  return {
    ...actual,
    screenForumSubmission: vi.fn(async () => actual.fallbackForumDecision()),
  }
})

const CATEGORY_ID = '10000000-0000-0000-0000-000000000005'

function topicRow(overrides: Record<string, unknown>) {
  return {
    id: 'topic-good',
    categoryId: CATEGORY_ID,
    categorySlug: 'general-discussion',
    categoryName: 'General Discussion',
    categoryColor: '#00ffff',
    userId: 'test-user-id',
    authorName: 'Larva Unit',
    authorAvatar: '/images/stage1_larva.png',
    authorStage: 1,
    title: 'A useful thread',
    slug: 'a-useful-thread',
    content: 'Enough content to stand as a real topic.',
    isPinned: false,
    isLocked: false,
    views: 0,
    repliesCount: 0,
    upvotes: 1,
    discoveryEligible: true,
    lastReplyAt: new Date('2026-08-25T12:00:00.000Z'),
    createdAt: new Date('2026-08-25T12:00:00.000Z'),
    updatedAt: new Date('2026-08-25T12:00:00.000Z'),
    deletedAt: null,
    profileHandle: null,
    profileLarvaId: null,
    profileAvatarConfig: null,
    ...overrides,
  }
}

describe('forum Jev quality wiring', () => {
  beforeEach(() => {
    vi.mocked(screenForumSubmission).mockReset()
    vi.mocked(screenForumSubmission).mockResolvedValue(fallbackForumDecision())
  })

  it('refuses a quarantined topic before insert', async () => {
    vi.mocked(screenForumSubmission).mockResolvedValueOnce({
      status: 'quarantine',
      reason: FORUM_QUARANTINE_ERROR,
      suggestedCategory: 'off-topic',
      qualityScore: 0,
      discoveryEligible: false,
      source: 'jev',
    })

    const insert = vi.fn()
    await expect(
      createForumTopicHandler({
        data: {
          categoryId: CATEGORY_ID,
          title: 'A normal looking title',
          content: 'This body is long enough to pass the length check and still be refused.',
        },
        context: { user: { sub: 'test-user-id' }, db: { insert } as any },
      }),
    ).rejects.toThrow(FORUM_QUARANTINE_ERROR)
    expect(insert).not.toHaveBeenCalled()
  })

  it('stores the quality score when Jev allows a topic', async () => {
    vi.mocked(screenForumSubmission).mockResolvedValueOnce({
      status: 'allow',
      suggestedCategory: 'sacred-doctrine-ai',
      qualityScore: 75,
      discoveryEligible: true,
      source: 'jev',
    })

    const values = vi.fn().mockImplementation(() => ({
      returning: vi.fn().mockResolvedValue([
        {
          id: 'topic-1',
          categoryId: CATEGORY_ID,
          userId: 'test-user-id',
          authorName: 'Larva Unit',
          authorAvatar: '/images/stage1_larva.png',
          authorStage: 1,
          title: 'Stage two in practice',
          slug: 'stage-two-in-practice',
          content: 'A detailed note about how the second stage feels day to day.',
          isPinned: false,
          isLocked: false,
          views: 0,
          repliesCount: 0,
          upvotes: 0,
          lastReplyAt: new Date('2026-08-25T12:00:00.000Z'),
          createdAt: new Date('2026-08-25T12:00:00.000Z'),
        },
      ]),
    }))

    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) return Promise.resolve([{ larvaId: 'Larva Unit', stage: 1, handle: null }])
              return Promise.resolve([
                { id: CATEGORY_ID, slug: 'general-discussion', name: 'General Discussion', color: '#00ffff' },
              ])
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({ values })),
    }

    const res = await createForumTopicHandler({
      data: {
        categoryId: CATEGORY_ID,
        title: 'Stage two in practice',
        content: 'A detailed note about how the second stage feels day to day.',
      },
      context: { user: { sub: 'test-user-id' }, db: mockDb as any },
    })

    expect(res.id).toBe('topic-1')
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        qualityScore: 75,
        discoveryEligible: true,
        suggestedCategory: 'sacred-doctrine-ai',
      }),
    )
  })

  it('drops low-quality topics from hot and keeps pinned ones', async () => {
    const rows = [
      topicRow({ id: 'low', slug: 'low', title: 'k', discoveryEligible: false, upvotes: 50 }),
      topicRow({ id: 'good', slug: 'good', title: 'Good', discoveryEligible: true, upvotes: 3 }),
      topicRow({ id: 'pin', slug: 'pin', title: 'Pinned', isPinned: true, discoveryEligible: false, upvotes: 0 }),
    ]
    const chain = {
      leftJoin: vi.fn(),
      where: vi.fn(),
      orderBy: vi.fn().mockResolvedValue(rows),
    }
    chain.leftJoin.mockReturnValue(chain)
    chain.where.mockReturnValue(chain)
    const db = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue(chain),
      })),
    }

    const hot = await getForumTopicsHandler({
      data: { sortBy: 'hot' },
      context: { db: db as any },
    })
    expect(hot.map((topic) => topic.id)).toEqual(['good', 'pin'])

    const searched = await getForumTopicsHandler({
      data: { sortBy: 'hot', query: 'k' },
      context: { db: db as any },
    })
    expect(searched.map((topic) => topic.id)).toContain('low')
  })
})
