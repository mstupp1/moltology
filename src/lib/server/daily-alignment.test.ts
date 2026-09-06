import { describe, it, expect, vi } from 'vitest'
import {
  getDailyAlignmentHandler,
  toggleDailyAlignmentTaskHandler,
} from './db-services'

describe('Daily Alignment Server Handlers', () => {
  it('returns default empty alignment when called without user context in getDailyAlignmentHandler', async () => {
    const res = await getDailyAlignmentHandler({ data: { date: '2026-08-24' }, context: {} })
    expect(res).toBeDefined()
    expect(res.tasks).toHaveLength(8)
    expect(res.completedCount).toBe(0)
    expect(res.streakDays).toBe(0)
  })

  it('throws unauthenticated error when called without user context in toggleDailyAlignmentTaskHandler', async () => {
    await expect(
      toggleDailyAlignmentTaskHandler({
        data: { taskKey: 'silent-synchronization', completed: true, date: '2026-08-24' },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })

  it('throws validation error when an invalid task key is supplied', async () => {
    await expect(
      toggleDailyAlignmentTaskHandler({
        data: { taskKey: 'invalid-nonexistent-task', completed: true, date: '2026-08-24' },
        context: { user: { sub: '00000000-0000-0000-0000-000000000001' } },
      })
    ).rejects.toThrow('Invalid liturgy identifier')
  })

  it('fetches daily alignment successfully with mock db and computes task list & streak', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            const rows = [
              { taskKey: 'silent-synchronization', completedOn: '2026-08-24' },
              { taskKey: 'prompt-construction', completedOn: '2026-08-24' },
            ]
            const p = Promise.resolve(rows) as any
            p.limit = vi.fn().mockResolvedValue([{ xp: 150, stage: 1 }])
            return p
          }),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          onConflictDoNothing: vi.fn().mockResolvedValue([]),
        })),
      })),
      delete: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockResolvedValue([]),
      })),
    }

    const res = await getDailyAlignmentHandler({
      data: { date: '2026-08-24' },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    expect(res).toBeDefined()
    expect(res.date).toBe('2026-08-24')
    expect(res.tasks).toHaveLength(8)
    expect(res.totalCount).toBe(8)
    expect(res.completedKeys).toContain('silent-synchronization')
    expect(res.completedKeys).toContain('prompt-construction')
    expect(res.completedCount).toBe(2)
    expect(res.isAllCompleted).toBe(false)
    expect(Array.isArray(res.history)).toBe(true)
    expect(res.xp).toBe(150)
    expect(res.stage).toBe(1)
    expect(res.progression).toBeDefined()
    expect(res.progression?.stageTitle).toBe('THE LARVAL INITIATE')
  })

  it('toggles task completion and inserts/deletes from database', async () => {
    const insertMock = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => ({
        onConflictDoNothing: vi.fn().mockResolvedValue([]),
      })),
    }))
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
          where: vi.fn().mockImplementation(() => {
            const rows = [
              { taskKey: 'silent-synchronization', completedOn: '2026-08-24', totalXp: 10, xp: 10, stage: 1 },
            ]
            const p = Promise.resolve(rows) as any
            p.limit = vi.fn().mockResolvedValue([{ taskKey: 'silent-synchronization', totalXp: 10, xp: 10, stage: 1 }])
            return p
          }),
        })),
      })),
      insert: insertMock,
      delete: deleteMock,
      update: updateMock,
    }

    // Test Toggle ON
    const toggleOnRes = await toggleDailyAlignmentTaskHandler({
      data: {
        taskKey: 'silent-synchronization',
        completed: true,
        date: '2026-08-24',
      },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    // routineCompletions + activityEvents + xpTransactions = 3 inserts
    expect(insertMock).toHaveBeenCalledTimes(3)
    expect(toggleOnRes.date).toBe('2026-08-24')
    expect(toggleOnRes.progression).toBeDefined()

    // Test Toggle OFF
    await toggleDailyAlignmentTaskHandler({
      data: {
        taskKey: 'silent-synchronization',
        completed: false,
        date: '2026-08-24',
      },
      context: {
        user: { sub: 'test-user-id' },
        db: mockDb as any,
      },
    })

    // routineCompletions + activityEvents + xpTransactions = 3 deletes
    expect(deleteMock).toHaveBeenCalledTimes(3)
  })
})
