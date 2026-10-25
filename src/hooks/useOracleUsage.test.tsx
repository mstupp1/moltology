import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useOracleUsage } from './useOracleUsage'
import { getOracleUsageFn } from '@/lib/server/oracle-usage-api'
import { buildOracleUsageSnapshot } from '@/lib/ai/usage-limits'

vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('a.b.c') }))
vi.mock('@/lib/server/oracle-usage-api', () => ({ getOracleUsageFn: vi.fn() }))
const flush = async () => { await act(async () => { await Promise.resolve() }) }
beforeEach(async () => {
  vi.useFakeTimers()
  const reset = renderHook(() => useOracleUsage(null))
  reset.unmount()
  vi.mocked(getOracleUsageFn).mockReset().mockResolvedValue(buildOracleUsageSnapshot([], false))
})
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('shared Oracle usage', () => {
  it('deduplicates reads and shares refreshed usage between surfaces', async () => {
    const first = renderHook(() => useOracleUsage('member'))
    const second = renderHook(() => useOracleUsage('member'))
    await flush()
    expect(getOracleUsageFn).toHaveBeenCalledTimes(1)
    expect(first.result.current.snapshot).toBe(second.result.current.snapshot)
    const next = buildOracleUsageSnapshot([new Date()], false)
    vi.mocked(getOracleUsageFn).mockResolvedValue(next)
    await act(async () => { await first.result.current.refresh() })
    expect(second.result.current.snapshot?.fiveHours.remaining).toBe(14)
  })
  it('refreshes on focus and once per minute only while visible', async () => {
    renderHook(() => useOracleUsage('member'))
    await flush()
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(getOracleUsageFn).toHaveBeenCalledTimes(2)
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(getOracleUsageFn).toHaveBeenCalledTimes(3)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await act(async () => { vi.advanceTimersByTime(60_000) })
    expect(getOracleUsageFn).toHaveBeenCalledTimes(3)
    vi.restoreAllMocks()
  })
  it('retains the last reading on failure and does not confirm a stale block', async () => {
    const now = new Date()
    vi.mocked(getOracleUsageFn).mockResolvedValue(buildOracleUsageSnapshot(Array.from({ length: 15 }, () => now), false, now))
    const view = renderHook(() => useOracleUsage('member'))
    await flush()
    expect(view.result.current.blocked).toBe(true)
    vi.mocked(getOracleUsageFn).mockRejectedValue(new Error('offline'))
    await act(async () => { await view.result.current.refresh() })
    expect(view.result.current.snapshot?.fiveHours.remaining).toBe(0)
    expect(view.result.current.unavailable).toBe(true)
    expect(view.result.current.blocked).toBe(false)
  })
  it('clears on sign-out and ignores a response from a previous account', async () => {
    let complete!: (value: ReturnType<typeof buildOracleUsageSnapshot>) => void
    vi.mocked(getOracleUsageFn).mockReturnValueOnce(new Promise((resolve) => { complete = resolve }))
    const view = renderHook(({ userId }) => useOracleUsage(userId), { initialProps: { userId: 'first' as string | null } })
    await flush()
    view.rerender({ userId: 'second' })
    await flush()
    const secondSnapshot = view.result.current.snapshot
    await act(async () => { complete(buildOracleUsageSnapshot([], true)) })
    expect(view.result.current.snapshot).toBe(secondSnapshot)
    view.rerender({ userId: null })
    expect(view.result.current.snapshot).toBeNull()
  })
  it('refreshes when blocked capacity becomes available', async () => {
    const now = new Date()
    const events = Array.from({ length: 15 }, () => new Date(now.getTime() - 5 * 60 * 60_000 + 2000))
    vi.mocked(getOracleUsageFn).mockResolvedValueOnce(buildOracleUsageSnapshot(events, false, now))
    const view = renderHook(() => useOracleUsage('member'))
    await flush()
    expect(view.result.current.blocked).toBe(true)
    await act(async () => { vi.advanceTimersByTime(2100) })
    expect(getOracleUsageFn).toHaveBeenCalledTimes(2)
    expect(view.result.current.blocked).toBe(false)
  })
})
