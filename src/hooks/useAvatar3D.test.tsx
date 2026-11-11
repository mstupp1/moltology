import { renderHook, waitFor, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const session = vi.hoisted(() => ({ value: { isPending: false, userId: 'u1', user: { id: 'u1', role: 'admin' } } as Record<string, unknown> }))
const getUserProfileFn = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useAuthSession', () => ({ useAuthSession: () => session.value }))
vi.mock('@/lib/jwt', () => ({ getAuthJWTToken: () => Promise.resolve('token') }))
vi.mock('@/lib/server/api', () => ({ getUserProfileFn }))

import { resetAvatar3DForTests, useAvatar3D } from './useAvatar3D'

describe('useAvatar3D', () => {
  beforeEach(() => {
    resetAvatar3DForTests()
    getUserProfileFn.mockReset()
    session.value = { isPending: false, userId: 'u1', user: { id: 'u1', role: 'admin' } }
  })

  it('is on for an admin with the experiment, and reads the profile once for many avatars', async () => {
    getUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['avatar-3d'] })
    const a = renderHook(() => useAvatar3D())
    const b = renderHook(() => useAvatar3D())
    expect(a.result.current).toBe(false)
    await waitFor(() => expect(a.result.current).toBe(true))
    expect(b.result.current).toBe(true)
    expect(getUserProfileFn).toHaveBeenCalledTimes(1)
  })

  it('stays off without the experiment and follows the switch when it changes', async () => {
    getUserProfileFn.mockResolvedValue({ role: 'admin', experiments: [] })
    const { result } = renderHook(() => useAvatar3D())
    await waitFor(() => expect(getUserProfileFn).toHaveBeenCalledTimes(1))
    expect(result.current).toBe(false)
    getUserProfileFn.mockResolvedValue({ role: 'admin', experiments: ['avatar-3d'] })
    act(() => window.dispatchEvent(new CustomEvent('experiments-changed')))
    await waitFor(() => expect(result.current).toBe(true))
  })

  it('never reads the profile for members or signed-out visitors', async () => {
    session.value = { isPending: false, userId: 'u2', user: { id: 'u2', role: 'member' } }
    const member = renderHook(() => useAvatar3D())
    session.value = { isPending: false, userId: null, user: null }
    const guest = renderHook(() => useAvatar3D())
    await new Promise((r) => setTimeout(r, 20))
    expect(member.result.current).toBe(false)
    expect(guest.result.current).toBe(false)
    expect(getUserProfileFn).not.toHaveBeenCalled()
  })
})
