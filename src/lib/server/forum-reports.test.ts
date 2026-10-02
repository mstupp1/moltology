import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import {
  createForumReportHandler,
  listForumReportsHandler,
  reviewForumReportHandler,
  removeForumReportTargetHandler,
  restoreForumReportTargetHandler,
  reopenForumReportHandler,
} from './db-services'
import { FORUM_REPORT_COPY } from '../forum-reports'

function selectLimit(rows: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue(rows),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(rows),
        }),
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

const reporterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const authorId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const topicId = '20000000-0000-0000-0000-000000000021'
const postId = '30000000-0000-0000-0000-000000000021'

const liveTopic = {
  id: topicId,
  userId: authorId,
  deletedAt: null,
}

const livePost = {
  id: postId,
  topicId,
  userId: authorId,
  deletedAt: null,
}

describe('Forum report handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated flag and watch reads', async () => {
    await expect(
      createForumReportHandler({
        data: { topicId, reason: 'surface_noise' },
        context: {},
      }),
    ).rejects.toThrow('Unauthenticated')
    await expect(listForumReportsHandler({ data: {}, context: {} })).rejects.toThrow('Unauthenticated')
  })

  it('rejects flagging your own topic or reply', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => selectLimit([{ ...liveTopic, userId: reporterId }])),
      insert: vi.fn(),
    }

    await expect(
      createForumReportHandler({
        data: { topicId, reason: 'surface_noise' },
        context: { user: { sub: reporterId }, db: mockDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.ownTarget)
    expect(mockDb.insert).not.toHaveBeenCalled()

    const postDb = {
      select: vi.fn().mockImplementation(() => selectLimit([{ ...livePost, userId: reporterId }])),
      insert: vi.fn(),
    }
    await expect(
      createForumReportHandler({
        data: { postId, reason: 'unkind_current' },
        context: { user: { sub: reporterId }, db: postDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.ownTarget)
  })

  it('rejects withdrawn and missing targets', async () => {
    const withdrawnDb = {
      select: vi.fn().mockImplementation(() => selectLimit([{ ...liveTopic, deletedAt: new Date() }])),
      insert: vi.fn(),
    }
    await expect(
      createForumReportHandler({
        data: { topicId, reason: 'safety_breach' },
        context: { user: { sub: reporterId }, db: withdrawnDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.withdrawnTarget)

    const missingDb = {
      select: vi.fn().mockImplementation(() => selectLimit([])),
      insert: vi.fn(),
    }
    await expect(
      createForumReportHandler({
        data: { postId, reason: 'other' },
        context: { user: { sub: reporterId }, db: missingDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.missingTarget)
  })

  it('rejects an unknown reason before writing', async () => {
    const mockDb = { select: vi.fn(), insert: vi.fn() }
    await expect(
      createForumReportHandler({
        data: { topicId, reason: 'toxicity' },
        context: { user: { sub: reporterId }, db: mockDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.reasonRequired)
    expect(mockDb.select).not.toHaveBeenCalled()
  })

  it('inserts a soft report row for another member topic', async () => {
    const inserted = {
      id: 'report-1',
      reporterId,
      topicId,
      postId: null,
      reason: 'surface_noise',
      note: 'Repeated empty promo.',
      status: 'open',
      createdAt: new Date('2026-09-06T04:00:00.000Z'),
    }
    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([liveTopic]))
      .mockImplementationOnce(() => selectLimit([]))

    const mockDb = {
      select,
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([inserted]),
        })),
      })),
    }

    const receipt = await createForumReportHandler({
      data: { topicId, reason: 'surface_noise', note: '  Repeated empty promo.  ' },
      context: { user: { sub: reporterId }, db: mockDb as any },
    })

    expect(receipt).toEqual({
      id: 'report-1',
      topicId,
      postId: null,
      reason: 'surface_noise',
      note: 'Repeated empty promo.',
      status: 'open',
      createdAt: '2026-09-06T04:00:00.000Z',
      alreadyReported: false,
    })
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('dedupes an open report for the same reporter and target', async () => {
    const existing = {
      id: 'report-open',
      reporterId,
      topicId,
      postId: null,
      reason: 'surface_noise',
      note: null,
      status: 'open',
      createdAt: new Date('2026-09-06T03:00:00.000Z'),
    }
    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([liveTopic]))
      .mockImplementationOnce(() => selectLimit([existing]))

    const mockDb = {
      select,
      insert: vi.fn(),
    }

    const receipt = await createForumReportHandler({
      data: { topicId, reason: 'unkind_current' },
      context: { user: { sub: reporterId }, db: mockDb as any },
    })

    expect(receipt.alreadyReported).toBe(true)
    expect(receipt.id).toBe('report-open')
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('seals the watch list for ordinary members', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => selectLimit([{ role: 'user' }])),
    }

    await expect(
      listForumReportsHandler({
        data: {},
        context: { user: { sub: reporterId }, db: mockDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.watchSealed)
  })

  it('returns open rows for an elevated steward', async () => {
    const reportRow = {
      id: 'report-2',
      reporterId,
      topicId,
      postId: null,
      reason: 'soft_shell_harm',
      note: null,
      status: 'open',
      createdAt: new Date('2026-09-06T05:00:00.000Z'),
    }
    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([reportRow]))
      .mockImplementationOnce(() =>
        selectWhere([
          {
            id: topicId,
            title: 'Keep the deep warm',
            slug: 'keep-the-deep-warm',
            categoryId: '10000000-0000-0000-0000-000000000001',
            deletedAt: null,
          },
        ]),
      )
      .mockImplementationOnce(() =>
        selectWhere([{ id: '10000000-0000-0000-0000-000000000001', slug: 'general-discussion' }]),
      )
      .mockImplementationOnce(() =>
        selectWhere([{ id: reporterId, handle: 'claw_lord', larvaId: 'LARVA UNIT #1' }]),
      )
      .mockImplementationOnce(() => selectWhere([]))

    const rows = await listForumReportsHandler({
      data: {},
      context: { user: { sub: authorId }, db: { select } as any },
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'report-2',
        reasonLabel: 'Soft-shell harm',
        reporterName: 'claw_lord',
        topicTitle: 'Keep the deep warm',
        categorySlug: 'general-discussion',
        targetKind: 'topic',
        targetWithdrawn: false,
      }),
    )
  })

  it('seals review writes for ordinary members', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => selectLimit([{ role: 'user' }])),
      update: vi.fn(),
    }

    await expect(
      reviewForumReportHandler({
        data: { reportId: 'report-2' },
        context: { user: { sub: reporterId }, db: mockDb as any },
      }),
    ).rejects.toThrow(FORUM_REPORT_COPY.watchSealed)
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it('marks an open flag reviewed for an elevated steward', async () => {
    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([{ id: 'report-2', status: 'open' }]))

    const mockDb = {
      select,
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'report-2', status: 'reviewed' }]),
          })),
        })),
      })),
    }

    const receipt = await reviewForumReportHandler({
      data: { reportId: 'report-2' },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(receipt).toEqual({ id: 'report-2', status: 'reviewed', alreadyReviewed: false })
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('returns alreadyReviewed when the flag is no longer open', async () => {
    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([{ id: 'report-2', status: 'reviewed' }]))

    const mockDb = {
      select,
      update: vi.fn(),
    }

    const receipt = await reviewForumReportHandler({
      data: { reportId: 'report-2' },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(receipt.alreadyReviewed).toBe(true)
    expect(mockDb.update).not.toHaveBeenCalled()
  })

  it('removes a flagged post from the forum and resolves open flags', async () => {
    const reportRow = {
      id: 'report-post',
      topicId,
      postId,
      status: 'open',
    }
    const postRow = {
      id: postId,
      deletedAt: null,
    }

    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([reportRow]))
      .mockImplementationOnce(() => selectLimit([postRow]))

    const updateCalls: any[] = []
    const mockDb = {
      select,
      update: vi.fn().mockImplementation((table: any) => ({
        set: vi.fn().mockImplementation((values: any) => ({
          where: vi.fn().mockImplementation((cond: any) => {
            updateCalls.push({ table, values, cond })
            return Promise.resolve([])
          }),
        })),
      })),
    }

    const receipt = await removeForumReportTargetHandler({
      data: { reportId: 'report-post' },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(receipt).toEqual({
      id: 'report-post',
      status: 'reviewed',
      targetKind: 'reply',
      targetId: postId,
      alreadyWithdrawn: false,
    })
    expect(mockDb.update).toHaveBeenCalled()
    // Should have soft-deleted the post and updated report status
    expect(updateCalls.some((c) => c.values.deletedAt !== undefined)).toBe(true)
    expect(updateCalls.some((c) => c.values.status === 'reviewed')).toBe(true)
  })

  it('removes a flagged topic from the forum and resolves open flags', async () => {
    const reportRow = {
      id: 'report-topic',
      topicId,
      postId: null,
      status: 'open',
    }
    const topicRow = {
      id: topicId,
      deletedAt: null,
    }

    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([reportRow]))
      .mockImplementationOnce(() => selectLimit([topicRow]))

    const updateCalls: any[] = []
    const mockDb = {
      select,
      update: vi.fn().mockImplementation((table: any) => ({
        set: vi.fn().mockImplementation((values: any) => ({
          where: vi.fn().mockImplementation((cond: any) => {
            updateCalls.push({ table, values, cond })
            return Promise.resolve([])
          }),
        })),
      })),
    }

    const receipt = await removeForumReportTargetHandler({
      data: { reportId: 'report-topic' },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(receipt).toEqual({
      id: 'report-topic',
      status: 'reviewed',
      targetKind: 'topic',
      targetId: topicId,
      alreadyWithdrawn: false,
    })
    expect(updateCalls.some((c) => c.values.deletedAt !== undefined)).toBe(true)
  })

  it('restores a removed transmission back to the forum', async () => {
    const reportRow = {
      id: 'report-post',
      topicId,
      postId,
    }

    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([reportRow]))

    const updateCalls: any[] = []
    const mockDb = {
      select,
      update: vi.fn().mockImplementation((table: any) => ({
        set: vi.fn().mockImplementation((values: any) => ({
          where: vi.fn().mockImplementation((cond: any) => {
            updateCalls.push({ table, values, cond })
            return Promise.resolve([])
          }),
        })),
      })),
    }

    const receipt = await restoreForumReportTargetHandler({
      data: { reportId: 'report-post', restoreContent: true },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(receipt).toEqual({
      id: 'report-post',
      restoredContent: true,
    })
    expect(updateCalls.some((c) => c.values.deletedAt === null)).toBe(true)
  })

  it('reopens a reviewed report', async () => {
    const select = vi.fn().mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))

    const mockDb = {
      select,
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            returning: vi.fn().mockResolvedValue([{ id: 'report-2', status: 'open' }]),
          })),
        })),
      })),
    }

    const receipt = await reopenForumReportHandler({
      data: { reportId: 'report-2' },
      context: { user: { sub: authorId }, db: mockDb as any },
    })

    expect(receipt).toEqual({ id: 'report-2', status: 'open' })
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('lists resolved reports with target content snippet and status', async () => {
    const resolvedRow = {
      id: 'report-resolved',
      reporterId,
      topicId,
      postId: null,
      reason: 'surface_noise',
      note: 'Spam report',
      status: 'reviewed',
      createdAt: new Date('2026-09-06T05:00:00.000Z'),
      updatedAt: new Date('2026-09-06T06:00:00.000Z'),
    }

    const select = vi
      .fn()
      .mockImplementationOnce(() => selectLimit([{ role: 'admin' }]))
      .mockImplementationOnce(() => selectLimit([resolvedRow]))
      .mockImplementationOnce(() =>
        selectWhere([
          {
            id: topicId,
            title: 'Promo topic',
            slug: 'promo-topic',
            categoryId: '10000000-0000-0000-0000-000000000001',
            deletedAt: new Date('2026-09-06T06:00:00.000Z'),
            content: 'Buy crypto gems cheap!',
          },
        ]),
      )
      .mockImplementationOnce(() =>
        selectWhere([{ id: '10000000-0000-0000-0000-000000000001', slug: 'general-discussion' }]),
      )
      .mockImplementationOnce(() =>
        selectWhere([{ id: reporterId, handle: 'sentinel', larvaId: 'LARVA #9' }]),
      )
      .mockImplementationOnce(() => selectWhere([]))

    const rows = await listForumReportsHandler({
      data: { status: 'reviewed' },
      context: { user: { sub: authorId }, db: { select } as any },
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'report-resolved',
        status: 'reviewed',
        targetKind: 'topic',
        targetWithdrawn: true,
        targetContent: 'Buy crypto gems cheap!',
      }),
    )
  })
})
