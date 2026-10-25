import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getOracleUsageHandler } from './oracle-usage'
import { getOracleUsageSnapshot } from '../ai/service'
import { buildOracleUsageSnapshot } from '../ai/usage-limits'
import { verifyAuthJWT } from '../jwt'

vi.mock('../ai/service', () => ({ getOracleUsageSnapshot: vi.fn() }))
vi.mock('../../db', () => ({ getDb: vi.fn(() => ({})) }))
vi.mock('../jwt', () => ({
  looksLikeJwt: (token?: string) => token === 'a.b.c',
  verifyAuthJWT: vi.fn(),
}))

beforeEach(() => { vi.resetAllMocks() })
describe('Oracle usage identity', () => {
  it('rejects an unverified user id and never reads usage', async () => {
    await expect(getOracleUsageHandler({ data: { userId: 'other' } })).rejects.toThrow('Unauthenticated')
    expect(getOracleUsageSnapshot).not.toHaveBeenCalled()
  })
  it('rejects mismatched identities', async () => {
    await expect(getOracleUsageHandler({ data: { userId: 'other' }, context: { user: { sub: 'member' } } })).rejects.toThrow('does not match')
    expect(getOracleUsageSnapshot).not.toHaveBeenCalled()
  })
  it('reads only the verified account and returns both allowance windows', async () => {
    vi.mocked(verifyAuthJWT).mockResolvedValue({ valid: true, payload: { sub: 'member' }, error: null })
    const snapshot = buildOracleUsageSnapshot([], true)
    vi.mocked(getOracleUsageSnapshot).mockResolvedValue(snapshot)
    expect(await getOracleUsageHandler({ data: { token: 'a.b.c' } })).toEqual(snapshot)
    expect(getOracleUsageSnapshot).toHaveBeenCalledWith('member')
  })
  it('propagates unavailable usage rather than inventing remaining messages', async () => {
    vi.mocked(getOracleUsageSnapshot).mockRejectedValue(new Error('unavailable'))
    await expect(getOracleUsageHandler({ context: { user: { sub: 'member' } } })).rejects.toThrow('unavailable')
  })
})
