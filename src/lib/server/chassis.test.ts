import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { getChassisLoadoutHandler, moveGearItemHandler } from './api'

describe('Chassis loadout handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects unauthenticated chassis inspection', async () => {
    await expect(
      getChassisLoadoutHandler({
        data: {},
        context: {},
      })
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
      })
    ).rejects.toThrow('Unauthenticated')
  })
})
