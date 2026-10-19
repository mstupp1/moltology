import { describe, expect, it, vi } from 'vitest'

vi.mock('../user-sync', () => ({ ensureUserProfile: vi.fn().mockResolvedValue(null) }))
vi.mock('../../db', () => ({ getDb: vi.fn(() => ({ mocked: true })) }))

import { updateUserStatsHandler } from './db-services'

describe('updateUserStatsHandler', () => {
  it('derives MoltMax labels from the score and ignores client labels', async () => {
    const sets: Array<Record<string, unknown>> = []
    const db = {
      insert: () => ({ values: () => ({ onConflictDoNothing: vi.fn().mockResolvedValue([]) }) }),
      update: () => ({
        set: (values: Record<string, unknown>) => {
          sets.push(values)
          return { where: () => ({ returning: vi.fn().mockResolvedValue([values]) }) }
        },
      }),
    }
    await updateUserStatsHandler({
      data: { moltmaxScore: 40, moltmaxClearance: 'ADMIN', moltmaxStage: 'STAFF' },
      context: { user: { sub: 'member-1' }, db: db as never },
    })
    expect(sets[0]).toMatchObject({ moltmaxScore: 40, moltmaxClearance: 'L-3', moltmaxStage: 'STAGE I · LARVAL INITIATE' })
  })
})
