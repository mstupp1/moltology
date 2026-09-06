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
  updateForumTopicHandler,
  updateForumPostHandler,
  deleteForumTopicHandler,
  deleteForumPostHandler,
  recordForumMentions,
  recordForumReplyNotifications,
  persistForumTopicVisit,
  persistForumBoardVisit,
  getForumTopicsHandler,
  getForumCategoriesHandler,
} from './db-services'
import { PLACEHOLDER_LARVA_ID, resolveMemberLarvaId } from '../larva-id'

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
          // topic + category + profile joins
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
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
                        profileLarvaId: null,
                        profileStage: null,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        if (selectCall === 2) {
          // posts + profile join
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([]),
                }),
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

  it('stamps a reply with member B unit label, not thread author A, when both still have the placeholder', async () => {
    const memberA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const memberB = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'
    const topicId = '20000000-0000-0000-0000-000000000003'
    const expectedB = resolveMemberLarvaId(memberB, PLACEHOLDER_LARVA_ID)
    const expectedA = resolveMemberLarvaId(memberA, PLACEHOLDER_LARVA_ID)

    let selectCall = 0
    let insertedValues: Record<string, unknown> | null = null
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) {
                return Promise.resolve([{ larvaId: PLACEHOLDER_LARVA_ID, stage: 1 }])
              }
              if (selectCall === 2) {
                return Promise.resolve([{ id: topicId }])
              }
              return Promise.resolve([{ repliesCount: 2 }])
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          insertedValues = values
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'post-b',
                topicId,
                parentId: null,
                userId: memberB,
                authorName: values.authorName,
                authorAvatar: values.authorAvatar,
                authorStage: values.authorStage,
                content: values.content,
                upvotes: 0,
                createdAt: new Date('2026-08-28T19:37:07.000Z'),
              },
            ]),
          }
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    }

    const res = await createForumPostHandler({
      data: {
        topicId,
        content: 'New initiate here, so no numbers worth bragging about yet.',
      },
      context: {
        user: { sub: memberB },
        db: mockDb as any,
      },
    })

    expect(insertedValues).toEqual(
      expect.objectContaining({
        userId: memberB,
        authorName: expectedB,
      }),
    )
    expect(insertedValues).not.toEqual(expect.objectContaining({ authorName: PLACEHOLDER_LARVA_ID }))
    expect(insertedValues).not.toEqual(expect.objectContaining({ authorName: expectedA }))
    expect(res.userId).toBe(memberB)
    expect(res.authorName).toBe(expectedB)
    expect(res.authorName).not.toBe(expectedA)
    expect(res.parentId).toBeNull()
  })

  it('rejects a nested reply when the parent post is missing', async () => {
    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) {
                return Promise.resolve([{ larvaId: PLACEHOLDER_LARVA_ID, stage: 1 }])
              }
              if (selectCall === 2) {
                return Promise.resolve([{ id: '20000000-0000-0000-0000-000000000003' }])
              }
              return Promise.resolve([])
            }),
          })),
        })),
      })),
      insert: vi.fn(),
    }

    await expect(
      createForumPostHandler({
        data: {
          topicId: '20000000-0000-0000-0000-000000000003',
          parentId: '30000000-0000-0000-0000-000000000099',
          content: 'This is enough content for a nested forum reply.',
        },
        context: {
          user: { sub: 'test-user-id' },
          db: mockDb as any,
        },
      })
    ).rejects.toThrow('no longer available')
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('rejects a nested reply when the parent belongs to another topic', async () => {
    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) {
                return Promise.resolve([{ larvaId: PLACEHOLDER_LARVA_ID, stage: 1 }])
              }
              if (selectCall === 2) {
                return Promise.resolve([{ id: '20000000-0000-0000-0000-000000000003' }])
              }
              return Promise.resolve([
                {
                  id: '30000000-0000-0000-0000-000000000001',
                  topicId: '20000000-0000-0000-0000-000000000001',
                  parentId: null,
                },
              ])
            }),
          })),
        })),
      })),
      insert: vi.fn(),
    }

    await expect(
      createForumPostHandler({
        data: {
          topicId: '20000000-0000-0000-0000-000000000003',
          parentId: '30000000-0000-0000-0000-000000000001',
          content: 'This is enough content for a nested forum reply.',
        },
        context: {
          user: { sub: 'test-user-id' },
          db: mockDb as any,
        },
      })
    ).rejects.toThrow('no longer available')
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('creates a nested reply under a valid parent in the same topic', async () => {
    const topicId = '20000000-0000-0000-0000-000000000003'
    const parentId = '30000000-0000-0000-0000-000000000006'
    let selectCall = 0
    let insertedValues: Record<string, unknown> | null = null
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) {
                return Promise.resolve([{ larvaId: PLACEHOLDER_LARVA_ID, stage: 2, handle: null }])
              }
              if (selectCall === 2) {
                return Promise.resolve([{ id: topicId }])
              }
              if (selectCall === 3) {
                return Promise.resolve([{ id: parentId, topicId, parentId: null }])
              }
              return Promise.resolve([{ repliesCount: 1 }])
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          insertedValues = values
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'post-nested',
                topicId,
                parentId,
                userId: 'nested-user',
                authorName: values.authorName,
                authorAvatar: values.authorAvatar,
                authorStage: values.authorStage,
                content: values.content,
                upvotes: 0,
                createdAt: new Date('2026-09-04T12:00:00.000Z'),
              },
            ]),
          }
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    }

    const res = await createForumPostHandler({
      data: {
        topicId,
        parentId,
        content: 'Nested reply content that meets the minimum length.',
      },
      context: {
        user: { sub: 'nested-user' },
        db: mockDb as any,
      },
    })

    expect(insertedValues).toEqual(expect.objectContaining({ topicId, parentId }))
    expect(res.parentId).toBe(parentId)
  })

  it('lists member B reply as B, not thread author A, when both stored names are the placeholder', async () => {
    const memberA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const memberB = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'
    const topicId = '20000000-0000-0000-0000-000000000003'
    const expectedA = resolveMemberLarvaId(memberA, PLACEHOLDER_LARVA_ID)
    const expectedB = resolveMemberLarvaId(memberB, PLACEHOLDER_LARVA_ID)

    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      {
                        id: topicId,
                        categoryId: '10000000-0000-0000-0000-000000000004',
                        categorySlug: 'moltmaxxing-biometrics',
                        categoryName: 'Moltmaxxing & Biometrics',
                        categoryColor: '#00ffff',
                        userId: memberA,
                        authorName: PLACEHOLDER_LARVA_ID,
                        authorAvatar: '/images/stage1_larva.png',
                        authorStage: 1,
                        title: 'BEST PRACTICES FOR SHELL HARDNESS & PINCER TORQUE GAINS',
                        slug: 'shell-hardness-pincer-torque-gains-tips',
                        content: 'My current Moltmaxxing metrics read.',
                        isPinned: false,
                        isLocked: false,
                        views: 520,
                        repliesCount: 3,
                        upvotes: 35,
                        lastReplyAt: new Date('2026-08-28T19:37:07.000Z'),
                        createdAt: new Date('2026-08-03T08:30:00.000Z'),
                        profileLarvaId: PLACEHOLDER_LARVA_ID,
                        profileStage: 1,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        if (selectCall === 2) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([
                    {
                      id: 'post-b',
                      topicId,
                      userId: memberB,
                      authorName: PLACEHOLDER_LARVA_ID,
                      authorAvatar: '/images/stage1_larva.png',
                      authorStage: 1,
                      content: 'New initiate here, so no numbers worth bragging about yet.',
                      upvotes: 0,
                      createdAt: new Date('2026-08-28T19:37:07.000Z'),
                      profileLarvaId: PLACEHOLDER_LARVA_ID,
                      profileStage: 1,
                    },
                  ]),
                }),
              }),
            }),
          }
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }
      }),
      update: vi.fn(),
    }

    const res = await getForumTopicDetailHandler({
      data: {
        slugOrId: 'shell-hardness-pincer-torque-gains-tips',
        categorySlug: 'moltmaxxing-biometrics',
        trackView: false,
      },
      context: {
        db: mockDb as any,
      },
    })

    expect(res?.topic.userId).toBe(memberA)
    expect(res?.topic.authorName).toBe(expectedA)
    expect(res?.posts).toHaveLength(1)
    expect(res?.posts[0].userId).toBe(memberB)
    expect(res?.posts[0].authorName).toBe(expectedB)
    expect(res?.posts[0].authorName).not.toBe(res?.topic.authorName)
    expect(res?.posts[0].authorName).not.toBe(PLACEHOLDER_LARVA_ID)
  })

  it('keeps seed reply attribution when the row has no member id', async () => {
    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      {
                        id: '20000000-0000-0000-0000-000000000003',
                        categoryId: '10000000-0000-0000-0000-000000000004',
                        categorySlug: 'moltmaxxing-biometrics',
                        categoryName: 'Moltmaxxing & Biometrics',
                        categoryColor: '#00ffff',
                        userId: null,
                        authorName: 'Larva Unit #8971',
                        authorAvatar: '/images/stage1_larva.png',
                        authorStage: 1,
                        title: 'BEST PRACTICES FOR SHELL HARDNESS & PINCER TORQUE GAINS',
                        slug: 'shell-hardness-pincer-torque-gains-tips',
                        content: 'Seed thread body.',
                        isPinned: false,
                        isLocked: false,
                        views: 520,
                        repliesCount: 1,
                        upvotes: 35,
                        lastReplyAt: new Date('2026-08-03T16:10:00.000Z'),
                        createdAt: new Date('2026-08-03T08:30:00.000Z'),
                        profileLarvaId: null,
                        profileStage: null,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([
                  {
                    id: '30000000-0000-0000-0000-000000000006',
                    topicId: '20000000-0000-0000-0000-000000000003',
                    userId: null,
                    authorName: 'Architect Vaelen',
                    authorAvatar: '/images/stage1_larva.png',
                    authorStage: 3,
                    content: 'Focus on completing the morning lock.',
                    upvotes: 21,
                    createdAt: new Date('2026-08-03T16:10:00.000Z'),
                    profileLarvaId: null,
                    profileStage: null,
                  },
                ]),
              }),
            }),
          }),
        }
      }),
      update: vi.fn(),
    }

    const res = await getForumTopicDetailHandler({
      data: {
        slugOrId: 'shell-hardness-pincer-torque-gains-tips',
        categorySlug: 'moltmaxxing-biometrics',
        trackView: false,
      },
      context: { db: mockDb as any },
    })

    expect(res?.topic.authorName).toBe('Larva Unit #8971')
    expect(res?.posts[0].authorName).toBe('Architect Vaelen')
    expect(res?.posts[0].authorStage).toBe(3)
  })

  it('prefers a claimed handle over the larva unit on write and read', async () => {
    const memberA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const memberB = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'
    const topicId = '20000000-0000-0000-0000-000000000009'

    let insertedValues: Record<string, unknown> | null = null
    const writeDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              return Promise.resolve([{ handle: 'claw_lord', larvaId: PLACEHOLDER_LARVA_ID, stage: 1 }])
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          insertedValues = values
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'topic-handle',
                categoryId: '10000000-0000-0000-0000-000000000005',
                userId: memberA,
                authorName: values.authorName,
                authorAvatar: values.authorAvatar,
                authorStage: values.authorStage,
                title: 'Handle attribution thread',
                slug: 'handle-attribution-thread',
                content: 'This is enough content for a forum topic.',
                isPinned: false,
                isLocked: false,
                views: 0,
                repliesCount: 0,
                upvotes: 0,
                lastReplyAt: new Date('2026-08-30T12:00:00.000Z'),
                createdAt: new Date('2026-08-30T12:00:00.000Z'),
              },
            ]),
          }
        }),
      })),
    }

    writeDb.select = vi.fn()
      .mockImplementationOnce(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([{ handle: 'claw_lord', larvaId: PLACEHOLDER_LARVA_ID, stage: 1 }]),
          })),
        })),
      }))
      .mockImplementationOnce(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                id: '10000000-0000-0000-0000-000000000005',
                slug: 'general-discussion',
                name: 'General Discussion',
                color: '#00ffff',
              },
            ]),
          })),
        })),
      }))

    const created = await createForumTopicHandler({
      data: {
        categoryId: '10000000-0000-0000-0000-000000000005',
        title: 'Handle attribution thread',
        content: 'This is enough content for a forum topic.',
      },
      context: { user: { sub: memberA }, db: writeDb as any },
    })

    expect(insertedValues).toEqual(expect.objectContaining({ authorName: 'claw_lord' }))
    expect(created.authorName).toBe('claw_lord')
    expect(created.authorName).not.toBe(PLACEHOLDER_LARVA_ID)

    let selectCall = 0
    const readDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      {
                        id: topicId,
                        categoryId: '10000000-0000-0000-0000-000000000004',
                        categorySlug: 'moltmaxxing-biometrics',
                        categoryName: 'Moltmaxxing & Biometrics',
                        categoryColor: '#00ffff',
                        userId: memberA,
                        authorName: PLACEHOLDER_LARVA_ID,
                        authorAvatar: '/images/stage1_larva.png',
                        authorStage: 1,
                        title: 'Handle attribution thread',
                        slug: 'handle-attribution-thread',
                        content: 'Thread body from a named member.',
                        isPinned: false,
                        isLocked: false,
                        views: 1,
                        repliesCount: 1,
                        upvotes: 0,
                        lastReplyAt: new Date('2026-08-30T12:00:00.000Z'),
                        createdAt: new Date('2026-08-30T12:00:00.000Z'),
                        profileHandle: 'claw_lord',
                        profileLarvaId: PLACEHOLDER_LARVA_ID,
                        profileStage: 1,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        if (selectCall === 2) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([
                    {
                      id: 'post-b',
                      topicId,
                      userId: memberB,
                      authorName: PLACEHOLDER_LARVA_ID,
                      authorAvatar: '/images/stage1_larva.png',
                      authorStage: 1,
                      content: 'Reply from the second designation.',
                      upvotes: 0,
                      createdAt: new Date('2026-08-30T12:05:00.000Z'),
                      profileHandle: 'pincer_prime',
                      profileLarvaId: PLACEHOLDER_LARVA_ID,
                      profileStage: 1,
                    },
                  ]),
                }),
              }),
            }),
          }
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }
      }),
      update: vi.fn(),
    }

    const detail = await getForumTopicDetailHandler({
      data: {
        slugOrId: 'handle-attribution-thread',
        categorySlug: 'moltmaxxing-biometrics',
        trackView: false,
      },
      context: { db: readDb as any },
    })

    expect(detail?.topic.authorName).toBe('claw_lord')
    expect(detail?.posts[0].authorName).toBe('pincer_prime')
    expect(detail?.posts[0].authorName).not.toBe(detail?.topic.authorName)
    expect(detail?.topic.authorName).not.toBe(PLACEHOLDER_LARVA_ID)
  })

  it('persists a soft hail for mentioned members and skips the author', async () => {
    const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const mentionedId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    const notificationValues: Record<string, unknown>[] = []

    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([
            { id: mentionedId, handle: 'pincer_prime' },
            { id: actorId, handle: 'claw_lord' },
          ]),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          notificationValues.push(values)
          return {
            onConflictDoNothing: vi.fn().mockResolvedValue([]),
          }
        }),
      })),
    }

    const written = await recordForumMentions(mockDb as any, {
      actorUserId: actorId,
      actorPublicName: 'claw_lord',
      content: 'Hail @pincer_prime and also @claw_lord in this thread.',
      sourceType: 'post',
      sourceId: 'post-mention',
      topicId: 'topic-mention',
      topicSlug: 'hail-thread',
      categorySlug: 'general-discussion',
    })

    expect(written).toEqual([mentionedId])
    expect(notificationValues).toHaveLength(1)
    expect(notificationValues[0]).toEqual(
      expect.objectContaining({
        userId: mentionedId,
        kind: 'forum_mention',
        actorUserId: actorId,
        title: 'You were hailed',
        detail: 'claw_lord hailed you in a discussion.',
        sourceKey: 'forum_mention:post:post-mention:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
        payload: expect.objectContaining({
          topicId: 'topic-mention',
          postId: 'post-mention',
          topicSlug: 'hail-thread',
          categorySlug: 'general-discussion',
          handle: 'pincer_prime',
        }),
      }),
    )
  })

  it('does not write a hail when the post names nobody', async () => {
    const mockDb = {
      select: vi.fn(),
      insert: vi.fn(),
    }
    const written = await recordForumMentions(mockDb as any, {
      actorUserId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      actorPublicName: 'claw_lord',
      content: 'This is enough content for a forum reply.',
      sourceType: 'post',
      sourceId: 'post-quiet',
      topicId: 'topic-quiet',
    })
    expect(written).toEqual([])
    expect(mockDb.select).not.toHaveBeenCalled()
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('persists a thread reply ping for the topic author and skips the replier', async () => {
    const topicAuthor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const replier = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    const notificationValues: Record<string, unknown>[] = []

    const mockDb = {
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          notificationValues.push(values)
          return {
            onConflictDoNothing: vi.fn().mockResolvedValue([]),
          }
        }),
      })),
    }

    const written = await recordForumReplyNotifications(mockDb as any, {
      actorUserId: replier,
      actorPublicName: 'claw_lord',
      replyPostId: 'post-reply',
      topicId: 'topic-reply',
      topicAuthorUserId: topicAuthor,
      parentAuthorUserId: replier,
      topicSlug: 'molt-notes',
      categorySlug: 'general-discussion',
    })

    expect(written).toBe(1)
    expect(notificationValues).toHaveLength(1)
    expect(notificationValues[0]).toEqual(
      expect.objectContaining({
        userId: topicAuthor,
        kind: 'forum_reply',
        actorUserId: replier,
        title: 'A reply reached your thread',
        detail: 'claw_lord answered a thread you opened.',
        sourceKey: 'forum_reply:post:post-reply:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        payload: expect.objectContaining({
          topicId: 'topic-reply',
          postId: 'post-reply',
          topicSlug: 'molt-notes',
          categorySlug: 'general-discussion',
          replyTarget: 'topic',
        }),
      }),
    )
  })

  it('persists a nested reply ping for the parent author', async () => {
    const parentAuthor = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    const topicAuthor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const notificationValues: Record<string, unknown>[] = []

    const mockDb = {
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          notificationValues.push(values)
          return {
            onConflictDoNothing: vi.fn().mockResolvedValue([]),
          }
        }),
      })),
    }

    const written = await recordForumReplyNotifications(mockDb as any, {
      actorUserId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      actorPublicName: 'pincer_prime',
      replyPostId: 'post-nested',
      topicId: 'topic-reply',
      topicAuthorUserId: topicAuthor,
      parentAuthorUserId: parentAuthor,
      topicSlug: 'molt-notes',
      categorySlug: 'general-discussion',
    })

    expect(written).toBe(2)
    expect(notificationValues.map((row) => row.userId).sort()).toEqual([parentAuthor, topicAuthor].sort())
    expect(notificationValues.find((row) => row.userId === parentAuthor)?.payload).toEqual(
      expect.objectContaining({ replyTarget: 'post' }),
    )
  })

  it('skips a reply ping when the author was already hailed in the same post', async () => {
    const topicAuthor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const mockDb = {
      insert: vi.fn(),
    }

    const written = await recordForumReplyNotifications(mockDb as any, {
      actorUserId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      actorPublicName: 'claw_lord',
      replyPostId: 'post-hail-reply',
      topicId: 'topic-reply',
      topicAuthorUserId: topicAuthor,
      skipUserIds: [topicAuthor],
    })

    expect(written).toBe(0)
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('persists a forum_reply row when a member answers another member\'s thread', async () => {
    const topicAuthor = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const replier = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    const topicId = '20000000-0000-0000-0000-000000000003'
    const notificationValues: Record<string, unknown>[] = []
    let selectCall = 0

    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => {
              selectCall += 1
              if (selectCall === 1) {
                return Promise.resolve([{ larvaId: 'LARVA UNIT #3', stage: 2, handle: 'claw_lord' }])
              }
              if (selectCall === 2) {
                return Promise.resolve([
                  {
                    id: topicId,
                    slug: 'molt-notes',
                    categoryId: '10000000-0000-0000-0000-000000000001',
                    userId: topicAuthor,
                  },
                ])
              }
              if (selectCall === 3) {
                return Promise.resolve([{ repliesCount: 0 }])
              }
              return Promise.resolve([{ slug: 'general-discussion' }])
            }),
          })),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          if (values.kind === 'forum_reply') {
            notificationValues.push(values)
            return {
              onConflictDoNothing: vi.fn().mockResolvedValue([]),
            }
          }
          return {
            returning: vi.fn().mockResolvedValue([
              {
                id: 'post-reply-persist',
                topicId,
                parentId: null,
                userId: replier,
                authorName: values.authorName,
                authorAvatar: values.authorAvatar,
                authorStage: values.authorStage,
                content: values.content,
                upvotes: 0,
                createdAt: new Date('2026-09-06T12:00:00.000Z'),
              },
            ]),
          }
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([]),
        })),
      })),
    }

    await createForumPostHandler({
      data: {
        topicId,
        content: 'This is enough content for a forum reply ping.',
      },
      context: {
        user: { sub: replier },
        db: mockDb as any,
      },
    })

    expect(notificationValues).toHaveLength(1)
    expect(notificationValues[0]).toEqual(
      expect.objectContaining({
        userId: topicAuthor,
        kind: 'forum_reply',
        sourceKey: 'forum_reply:post:post-reply-persist:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      }),
    )
  })
})

function selectLimit(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
      }),
    }),
  }
}

function selectWhere(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(rows),
    }),
  }
}

function returningUpdate(existing: Record<string, unknown>, captured: Record<string, unknown>[]) {
  return vi.fn().mockImplementation(() => ({
    set: vi.fn().mockImplementation((values: Record<string, unknown>) => {
      captured.push(values)
      return {
        where: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([{ ...existing, ...values }]),
        })),
      }
    }),
  }))
}

describe('Forum author edit and soft-delete', () => {
  const authorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  const otherId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const topicId = '20000000-0000-0000-0000-000000000010'
  const postId = '30000000-0000-0000-0000-000000000010'

  const existingTopic = {
    id: topicId,
    categoryId: '10000000-0000-0000-0000-000000000001',
    userId: authorId,
    authorName: 'claw_lord',
    authorAvatar: '/images/stage1_larva.png',
    authorStage: 1,
    title: 'Original topic title here',
    slug: 'original-topic-title-here',
    content: 'Original topic body long enough.',
    isPinned: false,
    isLocked: false,
    views: 4,
    repliesCount: 1,
    upvotes: 2,
    lastReplyAt: new Date('2026-09-06T01:00:00.000Z'),
    createdAt: new Date('2026-09-06T01:00:00.000Z'),
    updatedAt: new Date('2026-09-06T01:00:00.000Z'),
    deletedAt: null,
  }

  const existingPost = {
    id: postId,
    topicId,
    parentId: null,
    userId: authorId,
    authorName: 'claw_lord',
    authorAvatar: '/images/stage1_larva.png',
    authorStage: 1,
    content: 'Original reply body long enough.',
    upvotes: 1,
    createdAt: new Date('2026-09-06T01:10:00.000Z'),
    updatedAt: new Date('2026-09-06T01:10:00.000Z'),
    deletedAt: null,
  }

  const category = { slug: 'general-discussion', name: 'General Discussion', color: '#00ffff' }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated topic and reply edits', async () => {
    await expect(
      updateForumTopicHandler({
        data: { topicId, title: 'Revised topic title here', content: 'Revised topic body long enough.' },
        context: {},
      }),
    ).rejects.toThrow('Unauthenticated')
    await expect(
      updateForumPostHandler({
        data: { postId, content: 'Revised reply body long enough.' },
        context: {},
      }),
    ).rejects.toThrow('Unauthenticated')
    await expect(deleteForumTopicHandler({ data: { topicId }, context: {} })).rejects.toThrow('Unauthenticated')
    await expect(deleteForumPostHandler({ data: { postId }, context: {} })).rejects.toThrow('Unauthenticated')
  })

  it('rejects edit and delete from a non-author', async () => {
    const update = vi.fn()
    const mockDb = {
      select: vi.fn().mockImplementation(() => selectLimit([existingPost])),
      update,
    }

    await expect(
      updateForumPostHandler({
        data: { postId, content: 'Someone else trying to rewrite this.' },
        context: { user: { sub: otherId }, db: mockDb as any },
      }),
    ).rejects.toThrow('You can only edit your own posts.')
    expect(update).not.toHaveBeenCalled()

    const topicDb = {
      select: vi.fn().mockImplementation(() => selectLimit([existingTopic])),
      update,
    }
    await expect(
      deleteForumTopicHandler({
        data: { topicId },
        context: { user: { sub: otherId }, db: topicDb as any },
      }),
    ).rejects.toThrow('You can only delete your own posts.')
  })

  it('lets the author revise a reply and persist a new hail', async () => {
    const mentionedId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    const captured: Record<string, unknown>[] = []
    const notificationValues: Record<string, unknown>[] = []
    const select = vi.fn()
      .mockImplementationOnce(() => selectLimit([existingPost]))
      .mockImplementationOnce(() => selectLimit([{ slug: 'original-topic-title-here', categoryId: existingTopic.categoryId }]))
      .mockImplementationOnce(() => selectLimit([category]))
      .mockImplementationOnce(() => selectWhere([{ id: mentionedId, handle: 'pincer_prime' }]))
      .mockImplementationOnce(() => selectLimit([{ handle: 'claw_lord' }]))

    const mockDb = {
      select,
      update: returningUpdate(existingPost, captured),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
          notificationValues.push(values)
          return { onConflictDoNothing: vi.fn().mockResolvedValue([]) }
        }),
      })),
    }

    const res = await updateForumPostHandler({
      data: { postId, content: 'Ask @pincer_prime before the next molt cycle.' },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(res.content).toBe('Ask @pincer_prime before the next molt cycle.')
    expect(res.deletedAt).toBeNull()
    expect(captured[0]).toEqual(expect.objectContaining({
      content: 'Ask @pincer_prime before the next molt cycle.',
    }))
    expect(notificationValues[0]).toEqual(expect.objectContaining({
      userId: mentionedId,
      kind: 'forum_mention',
      sourceKey: `forum_mention:post:${postId}:${mentionedId}`,
    }))
  })

  it('lets the author revise their topic title and body', async () => {
    const captured: Record<string, unknown>[] = []
    const select = vi.fn()
      .mockImplementationOnce(() => selectLimit([existingTopic]))
      .mockImplementationOnce(() => selectLimit([category]))
      .mockImplementationOnce(() => selectLimit([{ handle: 'claw_lord' }]))

    const res = await updateForumTopicHandler({
      data: { topicId, title: 'Revised topic title here', content: 'Revised topic body long enough.' },
      context: {
        user: { sub: authorId },
        db: { select, update: returningUpdate(existingTopic, captured) } as any,
      },
    })

    expect(res.title).toBe('Revised topic title here')
    expect(res.content).toBe('Revised topic body long enough.')
    expect(res.slug).toBe(existingTopic.slug)
    expect(captured[0]).toEqual(expect.objectContaining({
      title: 'Revised topic title here',
      content: 'Revised topic body long enough.',
    }))
  })

  it('soft-deletes an author reply and redacts the body', async () => {
    const captured: Record<string, unknown>[] = []
    const select = vi.fn()
      .mockImplementationOnce(() => selectLimit([existingPost]))
      .mockImplementationOnce(() => selectLimit([{ handle: 'claw_lord' }]))

    const res = await deleteForumPostHandler({
      data: { postId },
      context: {
        user: { sub: authorId },
        db: { select, update: returningUpdate(existingPost, captured) } as any,
      },
    })

    expect(res.content).toBe('')
    expect(res.deletedAt).toBeTruthy()
    expect(captured[0].deletedAt).toBeInstanceOf(Date)
    expect(captured[0].content).toBeUndefined()
  })

  it('soft-deletes an author topic without wiping the title', async () => {
    const captured: Record<string, unknown>[] = []
    const select = vi.fn()
      .mockImplementationOnce(() => selectLimit([existingTopic]))
      .mockImplementationOnce(() => selectLimit([category]))
      .mockImplementationOnce(() => selectLimit([{ handle: 'claw_lord' }]))

    const res = await deleteForumTopicHandler({
      data: { topicId },
      context: {
        user: { sub: authorId },
        db: { select, update: returningUpdate(existingTopic, captured) } as any,
      },
    })

    expect(res.title).toBe(existingTopic.title)
    expect(res.content).toBe('')
    expect(res.deletedAt).toBeTruthy()
    expect(captured[0].deletedAt).toBeInstanceOf(Date)
  })

  it('refuses a second withdraw', async () => {
    const update = vi.fn()
    const mockDb = {
      select: vi.fn().mockImplementation(() =>
        selectLimit([{ ...existingPost, deletedAt: new Date('2026-09-06T01:20:00.000Z') }]),
      ),
      update,
    }
    await expect(
      deleteForumPostHandler({
        data: { postId },
        context: { user: { sub: authorId }, db: mockDb as any },
      }),
    ).rejects.toThrow('already withdrawn')
    expect(update).not.toHaveBeenCalled()
  })

  it('hides withdrawn bodies when reading a thread', async () => {
    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                leftJoin: vi.fn().mockReturnValue({
                  where: vi.fn().mockReturnValue({
                    limit: vi.fn().mockResolvedValue([
                      {
                        ...existingTopic,
                        deletedAt: new Date('2026-09-06T02:00:00.000Z'),
                        categorySlug: 'general-discussion',
                        categoryName: 'General Discussion',
                        categoryColor: '#00ffff',
                        profileHandle: 'claw_lord',
                        profileLarvaId: null,
                        profileStage: 1,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([
                  {
                    ...existingPost,
                    deletedAt: new Date('2026-09-06T02:05:00.000Z'),
                    profileHandle: 'claw_lord',
                    profileLarvaId: null,
                    profileStage: 1,
                  },
                ]),
              }),
            }),
          }),
        }
      }),
      update: vi.fn(),
    }

    const res = await getForumTopicDetailHandler({
      data: { slugOrId: existingTopic.slug, trackView: false },
      context: { db: mockDb as any },
    })

    expect(res?.topic.content).toBe('')
    expect(res?.topic.deletedAt).toBeTruthy()
    expect(res?.posts[0].content).toBe('')
    expect(res?.posts[0].deletedAt).toBeTruthy()
    expect(res?.topic.title).toBe(existingTopic.title)
  })

  it('upserts a topic visit and a board baseline when a member opens a thread', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue([])
    const onConflictDoNothing = vi.fn().mockResolvedValue([])
    const insert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate,
        onConflictDoNothing,
      }),
    }))

    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
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
                        profileLarvaId: null,
                        profileStage: null,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        if (selectCall === 2) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
                where: vi.fn().mockReturnValue({
                  orderBy: vi.fn().mockResolvedValue([]),
                }),
              }),
            }),
          }
        }
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }
      }),
      insert,
      update: vi.fn(),
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

    expect(res?.topic.id).toBe('20000000-0000-0000-0000-000000000001')
    expect(insert).toHaveBeenCalled()
    expect(onConflictDoUpdate).toHaveBeenCalled()
    expect(onConflictDoNothing).toHaveBeenCalled()
  })

  it('does not mark a visit when a guest opens a thread', async () => {
    const insert = vi.fn()
    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return {
            from: vi.fn().mockReturnValue({
              leftJoin: vi.fn().mockReturnValue({
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
                        profileLarvaId: null,
                        profileStage: null,
                      },
                    ]),
                  }),
                }),
              }),
            }),
          }
        }
        return {
          from: vi.fn().mockReturnValue({
            leftJoin: vi.fn().mockReturnValue({
              where: vi.fn().mockReturnValue({
                orderBy: vi.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }
      }),
      insert,
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })),
    }

    await getForumTopicDetailHandler({
      data: {
        slugOrId: 'welcome-to-community-core-directives',
        categorySlug: 'rules-announcements',
      },
      context: { db: mockDb as any },
    })

    expect(insert).not.toHaveBeenCalled()
  })

  it('hydrates unread on topic lists for signed-in members only', async () => {
    const topicRow = {
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
      views: 10,
      repliesCount: 2,
      upvotes: 4,
      lastReplyAt: new Date('2026-09-06T12:00:00.000Z'),
      createdAt: new Date('2026-09-01T12:00:00.000Z'),
      profileHandle: null,
      profileLarvaId: null,
      profileAvatarConfig: null,
    }

    const topicQuery = {
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([topicRow]),
    }
    topicQuery.leftJoin.mockReturnValue(topicQuery)

    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return { from: vi.fn().mockReturnValue(topicQuery) }
        }
        if (selectCall === 2) {
          return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }
        }
        if (selectCall === 3) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  topicId: topicRow.id,
                  lastVisitedAt: new Date('2026-09-06T10:00:00.000Z'),
                },
              ]),
            }),
          }
        }
        return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }
      }),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockReturnValue({
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        }),
      })),
    }

    const signedIn = await getForumTopicsHandler({
      data: { sortBy: 'latest' },
      context: { user: { sub: 'test-user-id' }, db: mockDb as any },
    })
    expect(signedIn[0].unread).toBe(true)
    expect(signedIn[0].voted).toBe(false)

    const guestDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockResolvedValue([topicRow]),
        }),
      })),
    }
    const guestChain = {
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockResolvedValue([topicRow]),
    }
    guestChain.leftJoin.mockReturnValue(guestChain)
    guestDb.select.mockImplementation(() => ({ from: vi.fn().mockReturnValue(guestChain) }))

    const guest = await getForumTopicsHandler({
      data: { sortBy: 'latest' },
      context: { db: guestDb as any },
    })
    expect(guest[0].unread).toBeUndefined()
  })

  it('counts unread topics on boards for signed-in members', async () => {
    const category = {
      id: '10000000-0000-0000-0000-000000000001',
      slug: 'rules-announcements',
      name: 'Rules & Directives',
      description: 'Official announcements.',
      icon: 'ShieldCheck',
      color: '#ff5540',
      sortOrder: 1,
    }
    let selectCall = 0
    const mockDb = {
      select: vi.fn().mockImplementation(() => {
        selectCall += 1
        if (selectCall === 1) {
          return { from: vi.fn().mockReturnValue({ orderBy: vi.fn().mockResolvedValue([category]) }) }
        }
        if (selectCall === 2) {
          return {
            from: vi.fn().mockReturnValue({
              groupBy: vi.fn().mockResolvedValue([{ categoryId: category.id, count: 1 }]),
            }),
          }
        }
        if (selectCall === 3) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  id: '20000000-0000-0000-0000-000000000001',
                  categoryId: category.id,
                  lastReplyAt: new Date('2026-09-06T12:00:00.000Z'),
                  createdAt: new Date('2026-09-01T12:00:00.000Z'),
                },
              ]),
            }),
          }
        }
        if (selectCall === 4) {
          return {
            from: vi.fn().mockReturnValue({
              where: vi.fn().mockResolvedValue([
                {
                  topicId: '20000000-0000-0000-0000-000000000001',
                  lastVisitedAt: new Date('2026-09-06T10:00:00.000Z'),
                },
              ]),
            }),
          }
        }
        return { from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) }
      }),
    }

    const signedIn = await getForumCategoriesHandler({
      data: {},
      context: { user: { sub: 'test-user-id' }, db: mockDb as any },
    })
    expect(signedIn[0].unreadCount).toBe(1)

    const guestDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([category]),
          groupBy: vi.fn().mockResolvedValue([{ categoryId: category.id, count: 1 }]),
        }),
      })),
    }
    const guest = await getForumCategoriesHandler({
      data: {},
      context: { db: guestDb as any },
    })
    expect(guest[0].unreadCount).toBeUndefined()
  })
})

describe('forum visit persist', () => {
  it('upserts lastVisitedAt for a topic and inserts a board baseline once', async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue([])
    const onConflictDoNothing = vi.fn().mockResolvedValue([])
    const values = vi.fn().mockReturnValue({ onConflictDoUpdate, onConflictDoNothing })
    const insert = vi.fn().mockReturnValue({ values })
    const db = { insert } as any

    await persistForumTopicVisit(db, 'member-1', 'topic-1', 'board-1')

    expect(insert).toHaveBeenCalledTimes(2)
    expect(onConflictDoUpdate).toHaveBeenCalled()
    expect(onConflictDoNothing).toHaveBeenCalled()
  })

  it('skips writes without a member or target', async () => {
    const insert = vi.fn()
    await persistForumTopicVisit({ insert } as any, '', 'topic-1')
    await persistForumBoardVisit({ insert } as any, 'member-1', '')
    expect(insert).not.toHaveBeenCalled()
  })
})
