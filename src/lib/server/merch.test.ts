import { describe, expect, it, vi } from 'vitest'
import { getMerchCatalogHandler, createMerchCheckoutSessionHandler } from './merch'

vi.mock('../../db', () => ({ getDb: vi.fn(() => ({})) }))

vi.mock('../user-sync', () => ({ ensureUserProfile: vi.fn().mockResolvedValue(null) }))

function storeDb(profile: { role: string; experiments?: string[] }) {
  const limit = vi.fn().mockResolvedValue([profile])
  const orderBy = vi.fn().mockResolvedValue([])
  const query = { from: () => query, where: () => query, limit, orderBy }
  return { select: vi.fn(() => query) }
}

describe('new store experiment server gate', () => {
  it.each([
    { role: 'admin', experiments: [] },
    { role: 'admin', experiments: ['premium'] },
    { role: 'user', experiments: ['new-store'] },
  ])('blocks catalog and checkout for $role with $experiments', async (profile) => {
    const db = storeDb(profile)
    const args = { context: { user: { sub: 'viewer-1' }, db: db as never } }
    await expect(getMerchCatalogHandler(args)).rejects.toThrow('This page is not available.')
    await expect(createMerchCheckoutSessionHandler({ ...args, data: { items: [] } })).rejects.toThrow('This page is not available.')
    expect(db.select).toHaveBeenCalledTimes(2)
  })

  it('loads the catalog for an opted-in admin', async () => {
    const db = storeDb({ role: 'admin', experiments: ['new-store'] })
    await expect(getMerchCatalogHandler({ context: { user: { sub: 'admin-1' }, db: db as never } })).resolves.toEqual([])
    expect(db.select).toHaveBeenCalledTimes(2)
  })
})
