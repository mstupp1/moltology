import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getPublicProfileHandler } from './db-services'

const MEMBER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const VIEWER = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'

const claimedRow = {
  id: MEMBER_A,
  larvaId: 'LARVA UNIT #2468',
  handle: 'mstupp',
  stage: 2,
  avatarConfig: null,
  createdAt: new Date('2026-08-01T00:00:00.000Z'),
}

function mockDb(profileRows: unknown[]) {
  const limit = vi.fn().mockImplementation(() => Promise.resolve([]))
  limit.mockResolvedValueOnce(profileRows)
  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit,
        })),
      })),
    })),
  }
}

describe('member dossier handle lookup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads a claimed designation by handle or uuid and keeps the stored spelling', async () => {
    const byHandle = await getPublicProfileHandler({
      data: { profileId: 'MSTUPP' },
      context: { user: { sub: VIEWER }, db: mockDb([claimedRow]) as any },
    })
    expect(byHandle?.id).toBe(MEMBER_A)
    expect(byHandle?.handle).toBe('mstupp')
    expect(byHandle?.displayName).toBe('mstupp')

    const byUuid = await getPublicProfileHandler({
      data: { profileId: MEMBER_A },
      context: { user: { sub: VIEWER }, db: mockDb([claimedRow]) as any },
    })
    expect(byUuid?.handle).toBe('mstupp')
    expect(byUuid?.id).toBe(MEMBER_A)
  })

  it('keeps serving a member who never claimed a designation by uuid', async () => {
    const unclaimed = { ...claimedRow, handle: null }
    const profile = await getPublicProfileHandler({
      data: { profileId: MEMBER_A },
      context: { user: { sub: VIEWER }, db: mockDb([unclaimed]) as any },
    })
    expect(profile?.id).toBe(MEMBER_A)
    expect(profile?.handle).toBeNull()
    expect(profile?.displayName).not.toBe('mstupp')
  })

  it('returns not-found when neither id nor designation matches', async () => {
    const profile = await getPublicProfileHandler({
      data: { profileId: 'ghost_handle' },
      context: { user: { sub: VIEWER }, db: mockDb([]) as any },
    })
    expect(profile).toBeNull()
  })
})
