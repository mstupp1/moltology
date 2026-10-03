import { describe, expect, it, vi } from 'vitest'

vi.mock('../../db', () => ({ getDb: vi.fn() }))

import { reviewMemberPosts } from './forum-standing'
import type { ForumGateAnswers } from '../quality/forum-gate'

const NOW = new Date('2026-10-02T12:00:00.000Z')

/** Minimal drizzle stand-in: each select resolves to the next queued row set. */
function fakeDb(selectResults: unknown[][], options: { voteInserts?: boolean } = {}) {
  const queue = [...selectResults]
  const updates: Array<{ set: Record<string, unknown> }> = []
  const votes: Array<Record<string, unknown>> = []
  const chain: any = {}
  for (const m of ['from', 'innerJoin', 'leftJoin', 'where', 'orderBy']) chain[m] = vi.fn(() => chain)
  chain.limit = vi.fn(() => Promise.resolve(queue.shift() ?? []))
  return {
    updates,
    votes,
    db: {
      select: vi.fn(() => chain),
      insert: vi.fn(() => ({
        values: vi.fn((values: Record<string, unknown>) => ({
          onConflictDoNothing: () => ({
            returning: () => {
              if (options.voteInserts === false) return Promise.resolve([])
              votes.push(values)
              return Promise.resolve([{ id: `vote-${votes.length}` }])
            },
          }),
        })),
      })),
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

  it('reuses the live score and only rescreens posts the live gate missed', async () => {
    const { db } = fakeDb([
      [],
      [
        { id: 'p1', userId: 'dana', content: 'Scored live.', qualityScore: 75, topicTitle: 'Hi' },
        { id: 'p2', userId: 'dana', content: 'Missed live.', qualityScore: null, topicTitle: 'Hi' },
      ],
    ])
    const evaluate = vi.fn(async () => score(4))
    const res = await reviewMemberPosts(db, { now: NOW, evaluate })
    expect(evaluate).toHaveBeenCalledTimes(1)
    expect(evaluate).toHaveBeenCalledWith(expect.objectContaining({ body: 'Missed live.' }))
    expect(res.reviewed.map((r) => r.id)).toEqual(['p1', 'p2'])
  })

  it('has a simulated member upvote strong posts instead of adding a Standing point', async () => {
    const { db, votes, updates } = fakeDb([
      [{ id: 't1', userId: 'alice', title: 'Shell routines', content: 'Great notes.', qualityScore: 80 }],
      [{ id: 'p1', userId: 'bob', content: 'lol', qualityScore: 10, topicTitle: 'Shell routines' }],
      [{ id: 'sim-1' }],
    ])
    const res = await reviewMemberPosts(db, { now: NOW, evaluate: async () => null })
    expect(votes).toEqual([{ userId: 'sim-1', topicId: 't1' }])
    expect(res.reviewed[0]).toMatchObject({ id: 't1', verdict: 'strong', upvotedBy: 'sim-1', standingDelta: 0 })
    // Alice's Standing rises through the upvote; only Bob gets an adjustment.
    expect(res.standingChanges).toEqual([{ userId: 'bob', delta: -1 }])
    expect(updates.some((u) => 'upvotes' in u.set)).toBe(true)
  })

  it('falls back to a Standing point when no simulated member can vote', async () => {
    const { db } = fakeDb(
      [
        [{ id: 't1', userId: 'alice', title: 'Shell routines', content: 'Great notes.', qualityScore: 80 }],
        [],
        [{ id: 'sim-1' }],
      ],
      { voteInserts: false },
    )
    const res = await reviewMemberPosts(db, { now: NOW, evaluate: async () => null })
    expect(res.reviewed[0].upvotedBy).toBeUndefined()
    expect(res.standingChanges).toEqual([{ userId: 'alice', delta: 1 }])
  })

  it('never has the author vote on their own post', async () => {
    const { db, votes } = fakeDb([
      [{ id: 't1', userId: 'sim-1', title: 'Shell routines', content: 'Great notes.', qualityScore: 80 }],
      [],
      [{ id: 'sim-1' }],
    ])
    await reviewMemberPosts(db, { now: NOW, evaluate: async () => null })
    expect(votes).toEqual([])
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
