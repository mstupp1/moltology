import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  where: vi.fn(),
  delete: vi.fn(),
  decrypt: vi.fn(),
  eq: vi.fn((column, id) => ({ column, id })),
}))

vi.mock('../src/db', () => ({
  getDb: () => ({ select: () => ({ from: mocks.from }), delete: mocks.delete }),
}))
vi.mock('better-auth/crypto', () => ({ symmetricDecrypt: mocks.decrypt }))
vi.mock('drizzle-orm', async (importOriginal) => ({
  ...await importOriginal<typeof import('drizzle-orm')>(),
  eq: mocks.eq,
}))
import { cleanJwks } from './clean-jwks'

const key = (id: string, privateKey = JSON.stringify({ encrypted: id })) => ({ id, privateKey })

describe('cleanJwks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.from.mockResolvedValue([])
    mocks.where.mockResolvedValue(undefined)
    mocks.delete.mockReturnValue({ where: mocks.where })
    mocks.decrypt.mockResolvedValue('decrypted')
    mocks.eq.mockImplementation((column, id) => ({ column, id }))
  })

  it('returns zero counts for an empty table', async () => {
    await expect(cleanJwks()).resolves.toEqual({ total: 0, pruned: 0 })
    expect(mocks.delete).not.toHaveBeenCalled()
    expect(mocks.decrypt).not.toHaveBeenCalled()
  })

  it('preserves decryptable keys', async () => {
    mocks.from.mockResolvedValue([key('valid')])
    await expect(cleanJwks()).resolves.toEqual({ total: 1, pruned: 0 })
    expect(mocks.decrypt).toHaveBeenCalledWith(expect.objectContaining({ data: { encrypted: 'valid' } }))
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  it('deletes only malformed and undecryptable keys', async () => {
    mocks.from.mockResolvedValue([key('valid'), key('bad-json', '{'), key('bad-secret')])
    mocks.decrypt.mockResolvedValueOnce('decrypted').mockRejectedValueOnce(new Error('wrong secret'))
    await expect(cleanJwks()).resolves.toEqual({ total: 3, pruned: 2 })
    expect(mocks.where.mock.calls.map(([condition]) => condition.id)).toEqual(['bad-json', 'bad-secret'])
  })

  it('force-deletes every key without attempting decryption', async () => {
    mocks.from.mockResolvedValue([key('one'), key('two')])
    await expect(cleanJwks({ forceAll: true })).resolves.toEqual({ total: 2, pruned: 2 })
    expect(mocks.where.mock.calls.map(([condition]) => condition.id)).toEqual(['one', 'two'])
    expect(mocks.decrypt).not.toHaveBeenCalled()
  })

  it('propagates database read failures', async () => {
    mocks.from.mockRejectedValue(new Error('read failed'))
    await expect(cleanJwks()).rejects.toThrow('read failed')
    expect(mocks.delete).not.toHaveBeenCalled()
  })

  it('propagates database delete failures', async () => {
    mocks.from.mockResolvedValue([key('invalid', '{')])
    mocks.where.mockRejectedValue(new Error('delete failed'))
    await expect(cleanJwks()).rejects.toThrow('delete failed')
  })
})
