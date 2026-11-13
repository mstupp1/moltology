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

  it('gives guests the starter character without touching their data', async () => {
    const { ALL_EQUIPMENT_CATALOG, STARTER_EQUIPMENT_CATALOG_IDS, STARTER_EQUIPPED_SLOTS, catalogSeedInsertValues } =
      await import('../equipment-seed-data')
    const rows = ALL_EQUIPMENT_CATALOG.filter((c) => STARTER_EQUIPMENT_CATALOG_IDS.includes(c.id)).map(
      catalogSeedInsertValues,
    )
    const chain = {
      select: vi.fn(() => chain),
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(async () => rows),
      execute: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    }
    const payload = await getChassisLoadoutHandler({ data: {}, context: { db: chain } })
    expect(chain.execute).not.toHaveBeenCalled()
    expect(chain.insert).not.toHaveBeenCalled()
    expect(payload.config).toBeNull()
    expect(payload.items).toHaveLength(STARTER_EQUIPMENT_CATALOG_IDS.length)
    expect(payload.items.filter((i) => i.equippedSlot).map((i) => i.equippedSlot)).toEqual([
      ...STARTER_EQUIPPED_SLOTS,
    ])
    expect(payload.catalog.length).toBeGreaterThan(0)
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
