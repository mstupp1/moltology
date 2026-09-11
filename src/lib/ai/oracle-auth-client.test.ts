import { describe, it, expect, vi, beforeEach } from 'vitest'
import { oracleAuthData } from './oracle-auth-client'
import { getAuthJWTToken } from '../jwt'

vi.mock('../jwt', () => ({
  getAuthJWTToken: vi.fn(),
}))

describe('oracleAuthData', () => {
  beforeEach(() => {
    vi.mocked(getAuthJWTToken).mockReset()
  })

  it('includes userId and token when both are available', async () => {
    vi.mocked(getAuthJWTToken).mockResolvedValueOnce('a.b.c')
    await expect(oracleAuthData('usr_1')).resolves.toEqual({ userId: 'usr_1', token: 'a.b.c' })
  })

  it('omits token when the JWT mint returns null', async () => {
    vi.mocked(getAuthJWTToken).mockResolvedValueOnce(null)
    await expect(oracleAuthData('usr_1')).resolves.toEqual({ userId: 'usr_1' })
  })
})
