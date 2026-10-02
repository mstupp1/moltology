import { describe, expect, it, vi } from 'vitest'

vi.mock('../../db', () => ({ getDb: vi.fn() }))

import { reviewMemberPosts } from './forum-standing'
import type { ForumGateAnswers } from '../quality/forum-gate'

const NOW = new Date('2026-10-02T12:00:00.000Z')

/** Minimal drizzle stand-in: each select resolves to the next queued row set. */
function fakeDb(selectResults: unknown[][]) {
  const queue = [...selectResults]
  const updates: Array<{ set: Record<string, unknown> }> = []
  const chain: any = {}
  for (const m of ['from', 'innerJoin', 'leftJoin', 'where', 'orderBy']) chain[m] = vi.fn(() => chain)
  chain.limit = vi.fn(() => Promise.resolve(queue.shift() ?? []))
  return {
    updates,
    db: {
      select: vi.fn(() => chain),
      update: vi.fn(() => ({
        set: vi.fn((set: Record<string, unknown>) => {
          updates.push({ set })
          return { where: vi.fn(() => Promise.resolve()) }
        }),
      })),
    } as any,
  }
}

const score = (rubric: number, prohibited = 0): ForumGateAnswers => ({
  isProhibited: { probability: prohibited },
  qualityScore: { score: rubric },
})

describe('reviewMemberPosts', () => {
  it('rewards strong posts, sinks weak replies, and adjusts Standing', async () => {
    const { db, updates } = fakeDb([
      [{ id: 't1', userId: 'alice', title: 'Shell routines', content: 'Detailed routine notes.', qualityScore: null }],
      [
        { id: 'p1', userId: 'bob', content: 'lol', qualityScore: 0, topicTitle: 'Shell routines' },
        { id: 'p2', userId: 'alice', content: 'A thoughtful answer.', qualityScore: 75, topicTitle: 'Shell routines' },
      ],
    ])
    const answers: Record<string, ForumGateAnswers> = {
      'Detailed routine notes.': score(4),
      lol: score(0),
      'A thoughtful answer.': score(4),
    }

    const res = await reviewMemberPosts(db, { now: NOW, evaluate: async (input) => answers[input.body] })

    expect(res.reviewed.map((r) => [r.id, r.verdict, r.sunk])).toEqual([
      ['t1', 'strong', false],
      ['p1', 'weak', true],
      ['p2', 'strong', false],
    ])
    expect(res.standingChanges).toEqual([
      { userId: 'alice', delta: 2 },
      { userId: 'bob', delta: -1 },
    ])
    expect(updates.map((u) => u.set)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reviewedAt: NOW, qualityScore: 0, sunk: true }),
      ]),
    )
    // Two content rows reviewed, plus one Standing write per author.
    expect(updates).toHaveLength(5)
  })

  it('sinks and penalizes prohibited posts that slipped past the live gate', async () => {
    const { db } = fakeDb([
      [],
      [{ id: 'p1', userId: 'spam', content: 'buy now', qualityScore: null, topicTitle: 'Hi' }],
    ])
    const res = await reviewMemberPosts(db, { now: NOW, evaluate: async () => score(2, 0.95) })
    expect(res.reviewed[0]).toMatchObject({ verdict: 'prohibited', sunk: true, standingDelta: -3 })
    expect(res.standingChanges).toEqual([{ userId: 'spam', delta: -3 }])
  })

  it('defers posts Jev could not score and writes nothing for them', async () => {
    const { db, updates } = fakeDb([
      [],
      [{ id: 'p1', userId: 'carol', content: 'Unscored reply.', qualityScore: null, topicTitle: 'Hi' }],
    ])
    const res = await reviewMemberPosts(db, { now: NOW, evaluate: async () => null })
    expect(res.deferred).toBe(1)
    expect(res.reviewed).toEqual([])
    expect(updates).toHaveLength(0)
  })

  it('writes nothing in dry-run mode', async () => {
    const { db, updates } = fakeDb([
      [{ id: 't1', userId: 'alice', title: 'Title', content: 'Body text.', qualityScore: null }],
      [],
    ])
    const res = await reviewMemberPosts(db, { now: NOW, dryRun: true, evaluate: async () => score(4) })
    expect(res.reviewed).toHaveLength(1)
    expect(updates).toHaveLength(0)
  })
})
