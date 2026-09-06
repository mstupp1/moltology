import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { createForumReportHandler, listForumReportsHandler } from './db-services'
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
})
