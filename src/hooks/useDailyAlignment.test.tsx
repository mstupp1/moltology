import React from 'react'
import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AlignmentProvider, useDailyAlignment } from './useDailyAlignment'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { CANONICAL_ALIGNMENT_TASKS, mergeCompletions, localDateString, shiftDays } from '@/lib/alignment-tasks'
import { getCachedAlignmentSnapshot, setCachedAlignmentSnapshot } from '@/lib/alignment-snapshot'
import * as serverApi from '@/lib/server/api'
import { getAuthJWTToken } from '@/lib/jwt'

// Mock authClient
const mockAuthClient = {
  useSession: vi.fn(),
}
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => mockAuthClient.useSession(),
  },
}))

vi.mock('@/lib/jwt', () => ({
  getAuthJWTToken: vi.fn().mockResolvedValue('mock-jwt-token'),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    <AlignmentProvider>{children}</AlignmentProvider>
  </ToastProvider>
)

describe('useDailyAlignment Hook Optimistic State & Rapid Clicks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.mocked(getAuthJWTToken).mockResolvedValue('mock-jwt-token')
    mockAuthClient.useSession.mockReturnValue({
      data: { user: { id: 'test-user-123' } },
      isPending: false,
    })
  })

  it('handles rapid clicking across multiple tasks without state rollback or flicker', async () => {
    const inFlightResolvers: Array<() => void> = []

    // Mock getDailyAlignmentFn
    vi.spyOn(serverApi, 'getDailyAlignmentFn').mockResolvedValue({
      date: '2026-08-27',
      tasks: mergeCompletions([]),
      completedKeys: [],
      completedCount: 0,
      totalCount: 8,
      isAllCompleted: false,
      history: [],
      streakDays: 0,
    })

    const completedServerKeys: string[] = []

    vi.spyOn(serverApi, 'toggleDailyAlignmentTaskFn').mockImplementation(async ({ data }: any) => {
      const { taskKey, completed } = data
      if (completed) {
        if (!completedServerKeys.includes(taskKey)) completedServerKeys.push(taskKey)
      } else {
        const idx = completedServerKeys.indexOf(taskKey)
        if (idx >= 0) completedServerKeys.splice(idx, 1)
      }

      const tasksSnapshot = mergeCompletions(completedServerKeys)

      // Return a promise that only resolves when manually triggered
      await new Promise<void>((resolve) => {
        inFlightResolvers.push(resolve)
      })

      return {
        date: '2026-08-27',
        tasks: tasksSnapshot,
        completedKeys: [...completedServerKeys],
        completedCount: completedServerKeys.length,
        totalCount: 8,
        isAllCompleted: completedServerKeys.length === 8,
        history: [{ date: '2026-08-27', completedCount: completedServerKeys.length }],
        streakDays: 1,
      }
    })

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.completedCount).toBe(0)

    // Rapidly toggle Task 1, Task 2, Task 3 in quick succession
    act(() => {
      result.current.toggleTask(CANONICAL_ALIGNMENT_TASKS[0].key)
      result.current.toggleTask(CANONICAL_ALIGNMENT_TASKS[1].key)
      result.current.toggleTask(CANONICAL_ALIGNMENT_TASKS[2].key)
    })

    // UI should immediately reflect all 3 tasks as completed optimistically
    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[1].completed).toBe(true)
    expect(result.current.tasks[2].completed).toBe(true)
    expect(result.current.completedCount).toBe(3)

    // Helper to resolve the next in-flight server mutation
    const resolveNext = async () => {
      await waitFor(() => {
        expect(inFlightResolvers.length).toBeGreaterThan(0)
      })
      const resolver = inFlightResolvers.shift()!
      await act(async () => {
        resolver()
      })
    }

    // Resolve the first network request (for Task 1)
    // Even though Task 1 server response only has Task 1 completed,
    // Tasks 2 and 3 MUST NOT roll back to false in the UI!
    await resolveNext()

    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[1].completed).toBe(true)
    expect(result.current.tasks[2].completed).toBe(true)
    expect(result.current.completedCount).toBe(3)

    // Resolve second request
    await resolveNext()

    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[1].completed).toBe(true)
    expect(result.current.tasks[2].completed).toBe(true)
    expect(result.current.completedCount).toBe(3)

    // Resolve third request
    await resolveNext()

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[1].completed).toBe(true)
    expect(result.current.tasks[2].completed).toBe(true)
    expect(result.current.completedCount).toBe(3)
  })

  it('handles rapid clicking of the SAME task (ON -> OFF -> ON) accurately', async () => {
    const inFlightResolvers: Array<() => void> = []
    const completedServerKeys: string[] = []

    vi.spyOn(serverApi, 'getDailyAlignmentFn').mockResolvedValue({
      date: '2026-08-27',
      tasks: mergeCompletions([]),
      completedKeys: [],
      completedCount: 0,
      totalCount: 8,
      isAllCompleted: false,
      history: [],
      streakDays: 0,
    })

    vi.spyOn(serverApi, 'toggleDailyAlignmentTaskFn').mockImplementation(async ({ data }: any) => {
      const { taskKey, completed } = data
      if (completed) {
        if (!completedServerKeys.includes(taskKey)) completedServerKeys.push(taskKey)
      } else {
        const idx = completedServerKeys.indexOf(taskKey)
        if (idx >= 0) completedServerKeys.splice(idx, 1)
      }

      await new Promise<void>((resolve) => {
        inFlightResolvers.push(resolve)
      })

      return {
        date: '2026-08-27',
        tasks: mergeCompletions(completedServerKeys),
        completedKeys: [...completedServerKeys],
        completedCount: completedServerKeys.length,
        totalCount: 8,
        isAllCompleted: false,
        history: [{ date: '2026-08-27', completedCount: completedServerKeys.length }],
        streakDays: 1,
      }
    })

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const taskKey = CANONICAL_ALIGNMENT_TASKS[0].key

    // Click ON
    act(() => {
      result.current.toggleTask(taskKey)
    })
    expect(result.current.tasks[0].completed).toBe(true)

    // Click OFF rapidly while first request is in-flight
    act(() => {
      result.current.toggleTask(taskKey)
    })
    expect(result.current.tasks[0].completed).toBe(false)

    // Click ON rapidly again
    act(() => {
      result.current.toggleTask(taskKey)
    })
    expect(result.current.tasks[0].completed).toBe(true)

    // Resolve first in-flight request
    await waitFor(() => {
      expect(inFlightResolvers.length).toBeGreaterThan(0)
    })
    const resolver = inFlightResolvers.shift()!
    await act(async () => {
      resolver()
    })

    // If second request was dispatched or skipped because target matches, wait for sync to finish
    if (inFlightResolvers.length > 0) {
      const resolver2 = inFlightResolvers.shift()!
      await act(async () => {
        resolver2()
      })
    }

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false)
    })

    expect(result.current.tasks[0].completed).toBe(true)
  })

  it('operates correctly for guest users without server calls', async () => {
    mockAuthClient.useSession.mockReturnValue({
      data: null,
      isPending: false,
    })

    const toggleSpy = vi.spyOn(serverApi, 'toggleDailyAlignmentTaskFn')

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isGuest).toBe(true)

    act(() => {
      result.current.toggleTask(CANONICAL_ALIGNMENT_TASKS[0].key)
      result.current.toggleTask(CANONICAL_ALIGNMENT_TASKS[1].key)
    })

    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[1].completed).toBe(true)
    expect(result.current.completedCount).toBe(2)
    expect(toggleSpy).not.toHaveBeenCalled()
  })

  it('paints last-known liturgy count before the server fetch resolves', async () => {
    const today = localDateString()
    const completedKeys = CANONICAL_ALIGNMENT_TASKS.slice(0, 4).map((t) => t.key)
    setCachedAlignmentSnapshot('test-user-123', { date: today, completedKeys })

    vi.spyOn(serverApi, 'getDailyAlignmentFn').mockImplementation(
      () => new Promise(() => {}),
    )

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.completedCount).toBe(4)
    expect(result.current.tasks.filter((t) => t.completed).map((t) => t.key)).toEqual(completedKeys)
  })

  it('holds a signed-in count as pending instead of treating empty tasks as 0/8', () => {
    vi.spyOn(serverApi, 'getDailyAlignmentFn').mockImplementation(
      () => new Promise(() => {}),
    )

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.completedCount).toBe(0)
  })

  it('does not inherit yesterday liturgies as today progress', () => {
    const today = localDateString()
    const yesterday = shiftDays(today, -1)
    setCachedAlignmentSnapshot('test-user-123', {
      date: yesterday,
      completedKeys: CANONICAL_ALIGNMENT_TASKS.slice(0, 4).map((t) => t.key),
    })

    vi.spyOn(serverApi, 'getDailyAlignmentFn').mockImplementation(
      () => new Promise(() => {}),
    )

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.completedCount).toBe(0)
  })

  it('writes last-known liturgies after a trusted server payload', async () => {
    const today = localDateString()
    const completedKeys = CANONICAL_ALIGNMENT_TASKS.slice(0, 4).map((t) => t.key)

    vi.spyOn(serverApi, 'getDailyAlignmentFn').mockResolvedValue({
      date: today,
      tasks: mergeCompletions(completedKeys),
      completedKeys,
      completedCount: 4,
      totalCount: 8,
      isAllCompleted: false,
      history: [{ date: today, completedCount: 4 }],
      streakDays: 1,
    })

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.completedCount).toBe(4)
    expect(getCachedAlignmentSnapshot('test-user-123')).toEqual({
      date: today,
      completedKeys,
    })
  })

  it('keeps last-known progress when the JWT is not ready yet', async () => {
    const today = localDateString()
    const completedKeys = CANONICAL_ALIGNMENT_TASKS.slice(0, 4).map((t) => t.key)
    setCachedAlignmentSnapshot('test-user-123', { date: today, completedKeys })
    vi.mocked(getAuthJWTToken).mockResolvedValueOnce(null)

    const fetchSpy = vi.spyOn(serverApi, 'getDailyAlignmentFn').mockResolvedValue({
      date: today,
      tasks: mergeCompletions([]),
      completedKeys: [],
      completedCount: 0,
      totalCount: 8,
      isAllCompleted: false,
      history: [],
      streakDays: 0,
    })

    const { result } = renderHook(() => useDailyAlignment(), { wrapper })

    expect(result.current.completedCount).toBe(4)
    expect(result.current.isLoading).toBe(false)

    await waitFor(() => {
      expect(vi.mocked(getAuthJWTToken)).toHaveBeenCalled()
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.completedCount).toBe(4)
  })
})
