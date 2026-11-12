import { describe, expect, it, vi } from 'vitest'
import { ALL_EQUIPMENT_CATALOG, STARTER_EQUIPMENT_CATALOG_IDS, catalogSeedInsertValues } from '../equipment-seed-data'

vi.mock('./write-auth', () => ({ resolveWriteAuth: vi.fn().mockResolvedValue(null) }))

const catalogRows = ALL_EQUIPMENT_CATALOG.filter((item) => item.kind === 'gear').map((item) => ({
  ...catalogSeedInsertValues(item),
}))
const fakeDb = {
  select: () => ({ from: () => ({ where: async () => catalogRows }) }),
}
vi.mock('../../db', () => ({ getDb: () => fakeDb }))

import { getMarketHandler } from './market'

describe('getMarketHandler for a signed-out visitor', () => {
  it('returns the catalog with only the starter set owned and nothing to spend', async () => {
    const market = await getMarketHandler({ data: {} })
    expect(market.guest).toBe(true)
    expect(market.addFree).toBe(false)
    expect(market.creditsLive).toBe(false)
    expect(market.wallet.balance).toBe(0)
    expect(market.wallet.firsts.every((f) => !f.done)).toBe(true)
    expect(market.pieces.length).toBeGreaterThan(0)
    const starter = new Set(STARTER_EQUIPMENT_CATALOG_IDS)
    for (const variant of market.pieces.flatMap((p) => p.variants)) {
      expect(variant.owned).toBe(starter.has(variant.catalogItemId))
    }
  })
})
