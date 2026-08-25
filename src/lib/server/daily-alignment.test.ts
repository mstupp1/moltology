import { describe, it, expect, vi } from 'vitest'
import {
  getDailyAlignmentHandler,
  toggleDailyAlignmentTaskHandler,
} from './api'

describe('Daily Alignment Server Handlers', () => {
  it('throws unauthenticated error when called without user context in getDailyAlignmentHandler', async () => {
    await expect(
      getDailyAlignmentHandler({ data: { date: '2026-08-24' }, context: {} })
    ).rejects.toThrow('Unauthenticated')
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
    ).rejects.toThrow('Invalid task key')
  })

  it('fetches daily alignment successfully with mock db and computes task list & streak', async () => {
    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation((condition) => {
            // Check if this is the today query or past range query
            return Promise.resolve([
              { taskKey: 'silent-synchronization', completedOn: '2026-08-24' },
              { taskKey: 'prompt-construction', completedOn: '2026-08-24' },
            ])
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

    const mockDb = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue([
            { taskKey: 'silent-synchronization', completedOn: '2026-08-24' },
          ]),
        })),
      })),
      insert: insertMock,
      delete: deleteMock,
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

    expect(insertMock).toHaveBeenCalled()
    expect(toggleOnRes.date).toBe('2026-08-24')

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

    expect(deleteMock).toHaveBeenCalled()
  })
})
