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
})
