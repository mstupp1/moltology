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
        catalogVariants: product.category === 'Mugs' ? mugBlanks : product.category === 'Tees' ? teeBlanks : product.category === 'Hats' ? [{ id: 7854, size: 'One size', color: 'Black' }] : [{ id: 22327, size: '16″×32″', color: 'Black' }],
        printFileUrl: (design) => `https://example.test/${design}.png`,
        thumbnailUrl: 'https://example.test/thumb.jpg',
      })
      expect(missing).toEqual([])
      expect(payload.sync_variants).toHaveLength(product.variants.length)
      expect(payload.sync_variants[0].files[0].type).toBe(product.printful.placement)
      expect(payload.sync_product.external_id).toBe(product.id)
    }
  })

  it('preserves the hat embroidery placement and red thread options', () => {
    const product = INITIAL_MERCH_PRODUCTS.find(item => item.slug === 'moltology-hat')!
    const { payload, missing } = buildSyncProductPayload({ product,
      catalogVariants: [{ id: 7854, size: 'One size', color: 'Black' }],
      printFileUrl: design => `https://example.test/${design}.png`, thumbnailUrl: 'https://example.test/hat.jpg' })
    expect(missing).toEqual([])
    expect(payload.sync_variants[0]).toMatchObject({ variant_id: 7854,
      files: [{ type: 'embroidery_front_large' }], options: [
        { id: 'embroidery_type', value: 'flat' },
        { id: 'thread_colors_front_large', value: ['#CC3333'] },
      ] })
  })

  it('formats retail prices and every variant has a design', () => {
    expect(formatRetailPrice(3300)).toBe('33.00')
    const keys = new Set(MERCH_DESIGNS.map((design) => design.key))
    for (const product of INITIAL_MERCH_PRODUCTS) for (const variant of product.variants) expect(keys.has(variant.design)).toBe(true)
  })
})
