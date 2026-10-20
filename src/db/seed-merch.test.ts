import { describe, expect, it, vi } from 'vitest'
import { seedMerchCatalog } from './seed-merch'
import { INITIAL_MERCH_PRODUCTS } from '../lib/merch-seed-data'
import { merchProducts, merchVariants } from './schema'

describe('scoped merch catalog seed', () => {
  function database() {
    const writes: Array<{ table: unknown; values: Record<string, unknown>; update: Record<string, unknown> }> = []
    const db = {
      insert: (table: unknown) => ({ values: (values: Record<string, unknown>) => ({ onConflictDoUpdate: async ({ set }: { set: Record<string, unknown> }) => { writes.push({ table, values, update: set }) } }) }),
      update: vi.fn(() => { throw new Error('Scoped seed must not retire unrelated products.') }),
    }
    return { db, writes }
  }
  it('writes only the provided product and variants and preserves large provider IDs', async () => {
    const product = { ...INITIAL_MERCH_PRODUCTS[0], variants: INITIAL_MERCH_PRODUCTS[0].variants.map((variant, index) => ({ ...variant, printfulSyncVariantId: 4123456789 + index })) }
    const { db, writes } = database()
    expect(await seedMerchCatalog(db as never, [product], false)).toBe(1)
    expect(writes.filter(write => write.table === merchProducts)).toHaveLength(1)
    expect(writes.filter(write => write.table === merchVariants)).toHaveLength(product.variants.length)
    expect(writes[0].values).toMatchObject({ id: product.id, isPublished: true })
    expect(writes[1].values).toMatchObject({ printfulSyncVariantId: 4123456789, isAvailable: true })
    expect(db.update).not.toHaveBeenCalled()
  })
  it('keeps placeholder products unpublished and variants unavailable on inserts and updates', async () => {
    const { db, writes } = database()
    const product = { ...INITIAL_MERCH_PRODUCTS[0], variants: INITIAL_MERCH_PRODUCTS[0].variants.map((variant, index) => ({ ...variant, printfulSyncVariantId: 920001 + index })) }
    await seedMerchCatalog(db as never, [product], false)
    expect(writes[0].values.isPublished).toBe(false)
    expect(writes[0].update.isPublished).toBe(false)
    expect(writes[1].values.isAvailable).toBe(false)
    expect(writes[1].update.isAvailable).toBe(false)
  })
})
