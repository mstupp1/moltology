import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../user-sync', () => ({ ensureUserProfile: vi.fn().mockResolvedValue(null) }))
vi.mock('../../db', () => ({ getDb: vi.fn(() => ({ mocked: true })) }))
vi.mock('./turnstile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./turnstile')>()),
  verifyTurnstileToken: vi.fn(),
}))
vi.mock('./forum-write-limit', () => ({ assertForumWriteLimit: vi.fn() }))
vi.mock('../quality/forum-gate', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../quality/forum-gate')>()),
  screenForumSubmission: vi.fn(),
}))

import { createBlogCommentHandler } from './db-services'
import { verifyTurnstileToken } from './turnstile'
import { assertForumWriteLimit } from './forum-write-limit'
import { screenForumSubmission } from '../quality/forum-gate'

const MEMBER = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function commentDb(postRows: unknown[] = [{ id: 'p1' }]) {
  const limit = vi.fn().mockResolvedValueOnce(postRows).mockResolvedValue([{ handle: 'claw_lord', stage: 2 }])
  const query = { from: () => query, where: () => query, limit }
  const returning = vi.fn().mockResolvedValue([
    { id: 'c1', postId: 'p1', userId: MEMBER, authorName: 'claw_lord', authorAvatar: '', content: 'The molt holds.', createdAt: new Date() },
  ])
  const insert = vi.fn(() => ({ values: () => ({ returning }) }))
  return { select: vi.fn(() => query), insert }
}

const args = (db: ReturnType<typeof commentDb>, turnstileToken?: string) => ({
  data: { postId: 'p1', content: 'The molt holds.', turnstileToken },
  context: { user: { sub: MEMBER }, db: db as never },
})

describe('createBlogCommentHandler guards', () => {
  beforeEach(() => {
    vi.mocked(verifyTurnstileToken).mockReset()
    vi.mocked(assertForumWriteLimit).mockReset()
    vi.mocked(screenForumSubmission).mockReset()
    vi.mocked(screenForumSubmission).mockResolvedValue({ status: 'publish' } as never)
  })

  it('rejects a comment without a passing bot check', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: false, errorMessage: 'Bot verification token missing. Please try again.' })
    const db = commentDb()
    await expect(createBlogCommentHandler(args(db))).rejects.toThrow('Bot verification token missing')
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('rejects comments on posts that are not published', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true })
    const db = commentDb([])
    await expect(createBlogCommentHandler(args(db, 'tok'))).rejects.toThrow('no longer available')
    expect(assertForumWriteLimit).not.toHaveBeenCalled()
  })

  it('applies the write limit and the moderation gate before saving', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true })
    vi.mocked(assertForumWriteLimit).mockRejectedValueOnce(new Error('Slow down.'))
    const limited = commentDb()
    await expect(createBlogCommentHandler(args(limited, 'tok'))).rejects.toThrow('Slow down.')
    expect(limited.insert).not.toHaveBeenCalled()

    vi.mocked(screenForumSubmission).mockResolvedValueOnce({ status: 'quarantine', reason: 'Held for review.' } as never)
    const held = commentDb()
    await expect(createBlogCommentHandler(args(held, 'tok'))).rejects.toThrow('Held for review.')
    expect(held.insert).not.toHaveBeenCalled()

    const ok = commentDb()
    await expect(createBlogCommentHandler(args(ok, 'tok'))).resolves.toMatchObject({ id: 'c1' })
    expect(assertForumWriteLimit).toHaveBeenLastCalledWith(MEMBER)
    expect(ok.insert).toHaveBeenCalledTimes(1)
  })
})
