import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import {
  createForumTopicHandler,
  createForumPostHandler,
  toggleForumTopicVoteHandler,
  toggleForumPostVoteHandler,
  getForumTopicDetailHandler,
} from './api'

describe('Forum Server Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws unauthenticated when creating a topic without identity', async () => {
    await expect(
      createForumTopicHandler({
        data: {
          categoryId: '10000000-0000-0000-0000-000000000001',
          title: 'Valid discussion title',
          content: 'This is enough content for a forum topic.',
        },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })

  it('throws unauthenticated when creating a reply without identity', async () => {
    await expect(
      createForumPostHandler({
        data: {
          topicId: '20000000-0000-0000-0000-000000000001',
          content: 'This is enough content for a forum reply.',
        },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })

  it('throws unauthenticated when toggling a topic vote without identity', async () => {
    await expect(
      toggleForumTopicVoteHandler({
        data: { topicId: '20000000-0000-0000-0000-000000000001' },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })

  it('throws when creating a reply for a missing topic', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      insert: vi.fn(),
    }

    await expect(
      createForumPostHandler({
        data: {
          topicId: '20000000-0000-0000-0000-000000000099',
          content: 'This is enough content for a forum reply.',
        },
        context: {
          user: { sub: 'test-user-id' },
          db: mockDb as any,
        },
      })
    ).rejects.toThrow('no longer available')
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('throws when upvoting a missing topic', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      })),
      insert: vi.fn(),
    }

    await expect(
      toggleForumTopicVoteHandler({
        data: { topicId: '20000000-0000-0000-0000-000000000099' },
        context: {
          user: { sub: 'test-user-id' },
          db: mockDb as any,
        },
      })
    ).rejects.toThrow('no longer available')
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('creates a topic and returns the mapped entry', async () => {
    const inserted = {
      id: 'topic-1',
      categoryId: '10000000-0000-0000-0000-000000000005',
      userId: 'test-user-id',
      authorName: 'Larva Unit',
      authorAvatar: '/images/stage1_larva.png',
      authorStage: 1,
      title: 'Valid discussion title',
      slug: 'valid-discussion-title',
      content: 'This is enough content for a forum topic.',
      isPinned: false,
      isLocked: false,
      views: 0,
      repliesCount: 0,
      upvotes: 0,
      lastReplyAt: new Date('2026-08-25T12:00:00.000Z'),
      createdAt: new Date('2026-08-25T12:00:00.000Z'),
    }

    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) {
                return Promise.resolve([{ larvaId: 'Larva Unit', stage: 1 }])
              }
              return Promise.resolve([
                {
                  id: inserted.categoryId,
                  slug: 'general-discussion',
                  name: 'General Discussion',
                  color: '#00ffff',
                },
              ])
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([inserted]),
        })),
      })),
    }

    const res = await createForumTopicHandler({
      data: {
        categoryId: inserted.categoryId,
        title: inserted.title,
        content: inserted.content,
      },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    expect(res.id).toBe('topic-1')
    expect(res.categorySlug).toBe('general-discussion')
    expect(res.title).toBe(inserted.title)
    expect(res.authorName).toBe('Larva Unit')
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('toggles a topic upvote on when no existing vote', async () => {
    let selectCall = 0
    const updateMock = vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    }))
    const insertMock = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockResolvedValue([]),
    }))

    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) return Promise.resolve([{ upvotes: 10 }])
              return Promise.resolve([])
            }),
          })),
        })),
      })),
      insert: insertMock,
      update: updateMock,
      delete: vi.fn(),
    }

    const res = await toggleForumTopicVoteHandler({
      data: { topicId: '20000000-0000-0000-0000-000000000001' },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    expect(res).toEqual({ upvotes: 11, voted: true })
    expect(insertMock).toHaveBeenCalled()
    expect(updateMock).toHaveBeenCalled()
  })

  it('toggles a reply upvote off when a vote already exists', async () => {
    let selectCall = 0
    const deleteMock = vi.fn().mockImplementation(() => ({
      where: vi.fn().mockResolvedValue([]),
    }))
    const updateMock = vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    }))

    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) return Promise.resolve([{ upvotes: 5 }])
              return Promise.resolve([{ id: 'vote-1' }])
            }),
          })),
        })),
      })),
      insert: vi.fn(),
      update: updateMock,
      delete: deleteMock,
    }

    const res = await toggleForumPostVoteHandler({
      data: { postId: '30000000-0000-0000-0000-000000000001' },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    expect(res).toEqual({ upvotes: 4, voted: false })
    expect(deleteMock).toHaveBeenCalled()
    expect(updateMock).toHaveBeenCalled()
  })

  it('hydrates topic vote state without incrementing views when trackView is false', async () => {
    let selectCall = 0
    const updateMock = vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    }))

    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          // topic + category join
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  limit: vi.fn().mockResolvedValue([
                    {
                      id: '20000000-0000-0000-0000-000000000001',
                      categoryId: '10000000-0000-0000-0000-000000000001',
                      categorySlug: 'rules-announcements',
                      categoryName: 'Rules & Directives',
                      categoryColor: '#ff5540',
                      userId: null,
                      authorName: 'Author',
                      authorAvatar: '/images/stage1_larva.png',
                      authorStage: 1,
                      title: 'Welcome',
                      slug: 'welcome-to-community-core-directives',
                      content: 'Body content here.',
                      isPinned: true,
                      isLocked: false,
                      views: 100,
                      repliesCount: 0,
                      upvotes: 88,
                      lastReplyAt: new Date('2026-08-03T20:30:00.000Z'),
                      createdAt: new Date('2026-08-01T12:00:00.000Z'),
                    },
                  ]),
                }),
              }),
            }),
          }
        }
        if (selectCall === 2) {
          // posts
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([]),
              }),
            }),
          }
        }
        // voted topic ids
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([
              { topicId: '20000000-0000-0000-0000-000000000001' },
            ]),
          }),
        }
      }),
      update: updateMock,
    }

    const res = await getForumTopicDetailHandler({
      data: {
        slugOrId: 'welcome-to-community-core-directives',
        categorySlug: 'rules-announcements',
        trackView: false,
      },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    expect(res?.topic.voted).toBe(true)
    expect(res?.topic.views).toBe(100)
    expect(updateMock).not.toHaveBeenCalled()
  })
})
