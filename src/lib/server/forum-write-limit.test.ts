import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({
  counts: { lastDay: 0, lastMinute: 0 } as { lastDay: number; lastMinute: number } | Error,
  inserts: [] as unknown[],
}))

vi.mock('../../db', () => ({
  getDb: () => ({
    select: () => ({
      from: () => ({
        where: async () => {
          if (state.counts instanceof Error) throw state.counts
          return [state.counts]
        },
      }),
    }),
    insert: () => ({
      values: async (row: unknown) => {
        state.inserts.push(row)
      },
    }),
  }),
}))

import { assertForumWriteLimit, FORUM_WRITE_USAGE_KIND } from './forum-write-limit'
import {
  FORUM_WRITE_DAILY_ERROR,
  FORUM_WRITE_DAILY_LIMIT,
  FORUM_WRITE_RATE_ERROR,
  FORUM_WRITE_RATE_LIMIT,
  forumWriteLimitError,
} from '../community-rules'

describe('forumWriteLimitError', () => {
  it('allows writes under both limits', () => {
    expect(forumWriteLimitError({ lastMinute: FORUM_WRITE_RATE_LIMIT - 1, lastDay: FORUM_WRITE_DAILY_LIMIT - 1 })).toBeNull()
  })

  it('blocks at the per-minute limit', () => {
    expect(forumWriteLimitError({ lastMinute: FORUM_WRITE_RATE_LIMIT, lastDay: 10 })).toBe(FORUM_WRITE_RATE_ERROR)
  })

  it('reports the daily limit first', () => {
    expect(
      forumWriteLimitError({ lastMinute: FORUM_WRITE_RATE_LIMIT, lastDay: FORUM_WRITE_DAILY_LIMIT }),
    ).toBe(FORUM_WRITE_DAILY_ERROR)
  })
})

describe('assertForumWriteLimit', () => {
  let n = 0
  const freshUser = () => `forum-limit-user-${n++}`

  beforeEach(() => {
    state.counts = { lastDay: 0, lastMinute: 0 }
    state.inserts = []
  })

  it('records an allowed write', async () => {
    const userId = freshUser()
    await expect(assertForumWriteLimit(userId)).resolves.toBeUndefined()
    expect(state.inserts).toEqual([{ userId, kind: FORUM_WRITE_USAGE_KIND }])
  })

  it('rejects from the stored count and records nothing', async () => {
    state.counts = { lastDay: 3, lastMinute: FORUM_WRITE_RATE_LIMIT }
    await expect(assertForumWriteLimit(freshUser())).rejects.toThrow(FORUM_WRITE_RATE_ERROR)
    expect(state.inserts).toEqual([])
  })

  it('falls back to the in-memory check when the database is unreachable', async () => {
    state.counts = new Error('db down')
    await expect(assertForumWriteLimit(freshUser())).resolves.toBeUndefined()
  })
})
