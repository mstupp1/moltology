import { beforeEach, describe, expect, it, vi } from 'vitest'
const { select, where, limit } = vi.hoisted(() => ({ select: vi.fn(), where: vi.fn(), limit: vi.fn() }))
vi.mock('../../db', () => ({ getDb: () => ({ select }) }))
import { getMemberShareIdentity } from './member-share-data'

beforeEach(() => {
  vi.clearAllMocks()
  select.mockReturnValue({ from: () => ({ where }) })
  where.mockReturnValue({ limit })
})
describe('public link-preview identity', () => {
  it('resolves opaque account ids to their public name and returns only public identity', async () => {
    limit.mockResolvedValue([{ id: 'NUBirqu1KNSnM41jXnQt3SMGobGHuoCJ', handle: 'mstupp', larvaId: 'LARVA UNIT #1234', email: 'private@example.com', bio: 'private' }])
    expect(await getMemberShareIdentity('NUBirqu1KNSnM41jXnQt3SMGobGHuoCJ')).toEqual({ userId: 'NUBirqu1KNSnM41jXnQt3SMGobGHuoCJ', handle: 'mstupp', larvaId: 'LARVA UNIT #1234', still: null })
    // The character is read only to name the saved portrait for the share card.
    expect(Object.keys(select.mock.calls[0][0])).toEqual(['id', 'handle', 'larvaId', 'avatarConfig', 'equipmentVersion', 'equippedAppearance'])
  })
  it('names the saved portrait only while it still shows the member', async () => {
    const look = { style: 'critters', seed: 'larva-a', race: 'crab', shellColor: 'cobalt' } as const
    const { avatarStillHash } = await import('../avatar-still')
    const still = avatarStillHash(look)
    const row = { id: 'u1', handle: 'mstupp', larvaId: 'L', equipmentVersion: 0, equippedAppearance: {} }
    limit.mockResolvedValue([{ ...row, avatarConfig: { ...look, still } }])
    expect((await getMemberShareIdentity('u1'))?.still).toBe(still)
    limit.mockResolvedValue([{ ...row, avatarConfig: { ...look, still, shellColor: 'gold' } }])
    expect((await getMemberShareIdentity('u1'))?.still).toBeNull()
  })
  it('resolves case-insensitive handles and prefers exact id matches', async () => {
    limit.mockResolvedValue([{ id: 'other', handle: 'mstupp', larvaId: 'other' }, { id: 'mstupp', handle: null, larvaId: 'LARVA UNIT #4321' }])
    expect((await getMemberShareIdentity('MSTUPP'))?.userId).toBe('other')
    expect((await getMemberShareIdentity('mstupp'))?.userId).toBe('mstupp')
  })
  it('returns no invented identity for a missing member or invalid route key', async () => {
    limit.mockResolvedValue([])
    expect(await getMemberShareIdentity('unknown')).toBeNull()
    expect(await getMemberShareIdentity('')).toBeNull()
    expect(await getMemberShareIdentity('x'.repeat(129))).toBeNull()
    expect(select).toHaveBeenCalledTimes(1)
  })
})
