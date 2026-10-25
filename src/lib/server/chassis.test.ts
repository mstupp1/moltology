import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getChassisLoadoutHandler, moveGearItemHandler, saveCharacterHandler } from './db-services'

describe('Chassis loadout handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated chassis inspection', async () => {
    await expect(
      getChassisLoadoutHandler({
        data: {},
        context: {},
      }),
    ).rejects.toThrow('Unauthenticated')
  })

  it('rejects unauthenticated gear moves', async () => {
    await expect(
      moveGearItemHandler({
        data: {
          itemId: '11111111-1111-4111-8111-111111111111',
          target: { type: 'equip', slot: 'claws-1' },
        },
        context: {},
      }),
    ).rejects.toThrow('Unauthenticated')
  })
  it('rejects an unauthenticated complete character save', async () => {
    await expect(
      saveCharacterHandler({
        data: {
          config: { style: 'critters', seed: 'forged' },
          expectedRevision: 0,
          placements: [],
        },
        context: {},
      }),
    ).rejects.toThrow('Unauthenticated')
  })
  it('rejects a client userId that differs from the authenticated member', async () => {
    await expect(
      saveCharacterHandler({
        data: {
          userId: 'victim',
          config: { style: 'critters', seed: 'forged' },
          expectedRevision: 0,
          placements: [],
        },
        context: { user: { sub: 'attacker' } },
      }),
    ).rejects.toThrow('does not match')
  })
})
