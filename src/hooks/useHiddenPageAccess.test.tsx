import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHiddenPageAccess } from './useHiddenPageAccess'
import { useAuthSession } from './useAuthSession'
import { getUserProfileFn } from '@/lib/server/api'

vi.mock('./useAuthSession', () => ({ useAuthSession: vi.fn() }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: vi.fn().mockResolvedValue('token') }))
vi.mock('@/lib/server/api', () => ({ getUserProfileFn: vi.fn() }))

describe('experiment page access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthSession).mockReturnValue({
      userId: 'admin-1', user: { id: 'admin-1', role: 'admin' }, isPending: false,
    } as never)
  })

  it('waits for the stored opt-in even for session admins', async () => {
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'admin', experiments: ['premium'] } as never)
    const { result } = renderHook(() => useHiddenPageAccess('premium'))
    expect(result.current).toEqual({ canView: false, pending: true })
    await waitFor(() => expect(result.current).toEqual({ canView: true, pending: false }))
  })

  it('refreshes after switching an experiment without enabling the other feature', async () => {
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'admin', experiments: ['new-store'] } as never)
    const { result } = renderHook(() => useHiddenPageAccess('premium'))
    await waitFor(() => expect(result.current).toEqual({ canView: false, pending: false }))
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'admin', experiments: ['premium'] } as never)
    act(() => window.dispatchEvent(new CustomEvent('experiments-changed')))
    await waitFor(() => expect(result.current.canView).toBe(true))
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'admin', experiments: [] } as never)
    act(() => window.dispatchEvent(new CustomEvent('experiments-changed')))
    await waitFor(() => expect(result.current.canView).toBe(false))
  })

  it('fails closed when the profile cannot be read', async () => {
    vi.mocked(getUserProfileFn).mockRejectedValue(new Error('unavailable'))
    const { result } = renderHook(() => useHiddenPageAccess('new-store'))
    await waitFor(() => expect(result.current).toEqual({ canView: false, pending: false }))
  })

  it('does not apply stored switches to members or guests', async () => {
    vi.mocked(useAuthSession).mockReturnValue({
      userId: 'member-1', user: { id: 'member-1', role: 'user' }, isPending: false,
    } as never)
    vi.mocked(getUserProfileFn).mockResolvedValue({ role: 'user', experiments: ['new-store'] } as never)
    const { result, rerender } = renderHook(() => useHiddenPageAccess('new-store'))
    await waitFor(() => expect(result.current).toEqual({ canView: false, pending: false }))
    vi.mocked(useAuthSession).mockReturnValue({ userId: null, user: null, isPending: false } as never)
    rerender()
    expect(result.current).toEqual({ canView: false, pending: false })
  })
})
