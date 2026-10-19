import { describe, expect, it, vi } from 'vitest'
import { applyBlogCommentTask, pickRecentArticle, prepareBlogCommentTasks, validateBlogComment, type SimulationPlanBlogCommentTask } from './simulation-blog'

// A queue of query results keeps each database read independently controllable.
function mockDb(rows: unknown[][]) {
  const query = () => {
    const result = Promise.resolve(rows.shift() ?? [])
    const chain: any = { then: result.then.bind(result) }
    for (const method of ['from', 'where', 'orderBy', 'limit']) chain[method] = vi.fn(() => chain)
    return chain
  }
  const returning = vi.fn().mockResolvedValue([{ id: 'comment-1' }])
  const values = vi.fn(() => ({ returning }))
  return { select: vi.fn(query), insert: vi.fn(() => ({ values })), values }
}
const member = { id: 'member-1', handle: 'shell-reader', stage: 1, larvaId: null, simulatedPersona: null }
const article = { id: 'article-1', slug: 'new-dispatch', title: 'A new dispatch', summary: 'Research summary', content: 'A concrete research result.', publishedAt: new Date('2026-10-15') }
const task: SimulationPlanBlogCommentTask = {
  id: 'blog-comment-1', kind: 'blog_comment', postId: article.id, postSlug: article.slug,
  authorId: member.id, authorName: member.handle, prompt: '', outputSchema: { content: 'string' },
  generated: { content: 'What happens to this result under higher pressure?' },
}

describe('simulation blog comments', () => {
  it('gives a week-old article half the probability of a fresh article', () => {
    const at = new Date('2026-10-16')
    const fresh = { publishedAt: at }
    const old = { publishedAt: new Date('2026-10-09') }
    expect(pickRecentArticle([fresh, old], at, () => 0.6)).toBe(fresh)
    expect(pickRecentArticle([fresh, old], at, () => 0.7)).toBe(old)
    expect(pickRecentArticle([], at)).toBeUndefined()
  })

  it('preserves recency preference even when all articles are very old', () => {
    const old = { publishedAt: new Date('2000-01-01') }
    const older = { publishedAt: new Date('1999-12-25') }
    expect(pickRecentArticle([old, older], new Date('2026-10-16'), () => 0.5)).toBe(old)
  })

  it('prepares grounded prompts and avoids repeated member/article pairs within a tick', async () => {
    const db = mockDb([[member], [article], []])
    const tasks = await prepareBlogCommentTasks(db as any, { count: 2 })
    expect(tasks).toHaveLength(1)
    expect(tasks[0].prompt).toContain(article.content)
    expect(tasks[0].authorId).toBe(member.id)
  })

  it('skips articles the available members already commented on', async () => {
    const db = mockDb([[member], [article], [{ userId: member.id, postId: article.id }]])
    expect(await prepareBlogCommentTasks(db as any)).toEqual([])
  })

  it('handles missing members and articles without tasks', async () => {
    expect(await prepareBlogCommentTasks(mockDb([[]]) as any)).toEqual([])
    expect(await prepareBlogCommentTasks(mockDb([[member], []]) as any)).toEqual([])
  })

  it('validates comment limits, spam and sanitization', () => {
    expect(validateBlogComment('<b>Useful point.</b>')).toBe('Useful point.')
    for (const content of ['', 'hi', 'x'.repeat(1001), 'Visit https://spam.test', '<b> </b>']) {
      expect(() => validateBlogComment(content)).toThrow()
    }
  })

  it('writes with the tick date and returns a verifiable comment ID and article URL', async () => {
    const db = mockDb([[member], [article], []])
    const at = new Date('2026-10-16')
    const result = await applyBlogCommentTask(db as any, task, { at })
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({ createdAt: at, userId: member.id }))
    expect(result).toMatchObject({ commentId: 'comment-1', url: 'https://moltology.org/news/new-dispatch' })
  })

  it.each([
    { rows: [[], [article]], reason: 'Author or published article unavailable.' },
    { rows: [[member], []], reason: 'Author or published article unavailable.' },
    { rows: [[member], [article], [{ id: 'existing' }]], reason: 'Member already commented on this article.' },
  ])('rechecks eligibility on apply: $reason', async ({ rows, reason }) => {
    const db = mockDb(rows)
    expect(await applyBlogCommentTask(db as any, task)).toMatchObject({ skipped: true, reason })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it('validates dry runs without writing', async () => {
    const db = mockDb([[member], [article], []])
    expect(await applyBlogCommentTask(db as any, task, { dryRun: true })).toMatchObject({ dryRun: true })
    expect(db.insert).not.toHaveBeenCalled()
  })
})
