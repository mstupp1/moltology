import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveWriteAuth } from './write-auth'

vi.mock('../jwt', () => ({
  looksLikeJwt: (token?: string | null) =>
    !!token && token.split('.').length === 3 && token.split('.').every((p) => p.length > 0),
  verifyNeonJWT: vi.fn(),
}))

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { verifyNeonJWT } from '../jwt'
import { ensureUserProfile } from '../user-sync'
import { getDb } from '../../db'

describe('resolveWriteAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses middleware context user when present', async () => {
    const result = await resolveWriteAuth({
      context: { user: { sub: 'user-from-context' }, token: 'a.b.c', db: { fromCtx: true } as any },
      data: { userId: 'user-from-context' },
    })

    expect(result?.userId).toBe('user-from-context')
    expect(result?.dbClient).toEqual({ fromCtx: true })
    expect(ensureUserProfile).toHaveBeenCalledWith('user-from-context')
  })

  it('verifies data.token when middleware has no user', async () => {
    vi.mocked(verifyNeonJWT).mockResolvedValue({
      valid: true,
      payload: { sub: 'user-from-jwt' },
      error: null,
    })

    const result = await resolveWriteAuth({
      data: { token: 'eyJ.payload.sig' },
      context: {},
    })

    expect(verifyNeonJWT).toHaveBeenCalledWith('eyJ.payload.sig')
    expect(result?.userId).toBe('user-from-jwt')
    expect(getDb).toHaveBeenCalled()
  })

  it('rejects bare userId without a verified JWT', async () => {
    await expect(
      resolveWriteAuth({
        data: { userId: 'spoofed-user' },
        context: {},
      })
    ).rejects.toThrow('Unauthenticated')
  })

  it('rejects mismatched userId vs JWT sub', async () => {
    await expect(
      resolveWriteAuth({
        context: { user: { sub: 'real-user' } },
        data: { userId: 'other-user' },
      })
    ).rejects.toThrow('does not match')
  })

  it('returns null when requireAuth is false and no identity exists', async () => {
    const result = await resolveWriteAuth({
      data: {},
      context: {},
      requireAuth: false,
    })
    expect(result).toBeNull()
  })
})
