import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAccountProfile } from './useAccountProfile'
import { getUserProfileFn } from '@/lib/server/api'
import { getQueryClient, clearAccountQueryCache, QUERY_CACHE_STORAGE_KEY } from '@/lib/query/client'
import { accountKeys } from '@/lib/query/account'

vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/lib/server/api', () => ({ getUserProfileFn: vi.fn() }))

describe('useAccountProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getUserProfileFn).mockResolvedValue({ id: 'm-1', handle: 'molty' } as never)
  })

  it('is undefined (unknown) until loaded, never a default', async () => {
    const { result } = renderHook(() => useAccountProfile('m-1'))
    expect(result.current.profile).toBeUndefined()
    expect(result.current.isLoading).toBe(true)
    await waitFor(() => expect(result.current.profile?.handle).toBe('molty'))
    expect(result.current.isLoading).toBe(false)
  })

  it('shares one request between every reader', async () => {
    const a = renderHook(() => useAccountProfile('m-1'))
    const b = renderHook(() => useAccountProfile('m-1'))
    await waitFor(() => expect(b.result.current.profile?.handle).toBe('molty'))
    expect(a.result.current.profile?.handle).toBe('molty')
    expect(getUserProfileFn).toHaveBeenCalledTimes(1)
  })

  it('paints a cached profile at once and refreshes on a profile change event', async () => {
    getQueryClient().setQueryData(accountKeys.profile('m-1'), { id: 'm-1', handle: 'old' })
    const { result } = renderHook(() => useAccountProfile('m-1'))
    expect(result.current.profile?.handle).toBe('old')
    act(() => window.dispatchEvent(new CustomEvent('member-handle-changed')))
    await waitFor(() => expect(result.current.profile?.handle).toBe('molty'))
  })

  it('is null for guests and does not fetch', () => {
    const { result } = renderHook(() => useAccountProfile(null))
    expect(result.current.profile).toBeNull()
    expect(getUserProfileFn).not.toHaveBeenCalled()
  })

  it('sign-out clears member data from memory and this device', async () => {
    const { result } = renderHook(() => useAccountProfile('m-1'))
    await waitFor(() => expect(result.current.profile?.handle).toBe('molty'))
    window.localStorage.setItem(QUERY_CACHE_STORAGE_KEY, '{}')
    clearAccountQueryCache()
    expect(getQueryClient().getQueryData(accountKeys.profile('m-1'))).toBeUndefined()
    expect(window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY)).toBeNull()
  })
})
