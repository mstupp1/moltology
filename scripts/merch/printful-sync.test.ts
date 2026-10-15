import { describe, expect, it } from 'vitest'
import { INITIAL_MERCH_PRODUCTS } from '../../src/lib/merch-seed-data'
import { MERCH_DESIGNS } from './designs'
import { buildSyncProductPayload, formatRetailPrice, matchCatalogVariant } from './printful-sync'

const mugBlanks = [
  { id: 1320, size: '11 oz', color: 'White' },
  { id: 4830, size: '15 oz', color: 'White' },
]
const teeBlanks = ['Black', 'White'].flatMap((color, c) =>
  ['S', 'M', 'L', 'XL', '2XL'].map((size, s) => ({ id: 4000 + c * 10 + s, size, color })),
)

describe('Printful sync payloads', () => {
  it('matches mugs on size and tees on color and size', () => {
    expect(matchCatalogVariant(mugBlanks, { size: '11 oz', color: 'Abyss' }, false)?.id).toBe(1320)
    expect(matchCatalogVariant(teeBlanks, { size: '2XL', color: 'White' }, true)?.id).toBe(4014)
    expect(matchCatalogVariant(teeBlanks, { size: '3XL', color: 'White' }, true)).toBeNull()
  })

  it('builds one sync variant per catalog variant with its print file', () => {
    for (const product of INITIAL_MERCH_PRODUCTS) {
      const { payload, missing } = buildSyncProductPayload({
        product,
        catalogVariants: product.category === 'Mugs' ? mugBlanks : teeBlanks,
        printFileUrl: (design) => `https://example.test/${design}.png`,
        thumbnailUrl: 'https://example.test/thumb.jpg',
      })
      expect(missing).toEqual([])
      expect(payload.sync_variants).toHaveLength(product.variants.length)
      expect(payload.sync_variants[0].files[0].type).toBe(product.printful.placement)
      expect(payload.sync_product.external_id).toBe(product.id)
    }
  })

  it('formats retail prices and every variant has a design', () => {
    expect(formatRetailPrice(3300)).toBe('33.00')
    const keys = new Set(MERCH_DESIGNS.map((design) => design.key))
    for (const product of INITIAL_MERCH_PRODUCTS) for (const variant of product.variants) expect(keys.has(variant.design)).toBe(true)
  })
})
