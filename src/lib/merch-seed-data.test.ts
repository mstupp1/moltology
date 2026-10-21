import { describe, expect, it } from 'vitest'
import { INITIAL_MERCH_PRODUCTS, isPlaceholderSyncId, merchCatalogView, withPrintfulSync } from './merch-seed-data'

describe('merch catalog', () => {
  it('has unique ids, slugs and Printful ids', () => {
    const ids = INITIAL_MERCH_PRODUCTS.flatMap((product) => [product.id, ...product.variants.map((variant) => variant.id)])
    const syncIds = INITIAL_MERCH_PRODUCTS.flatMap((product) => product.variants.map((variant) => variant.printfulSyncVariantId))
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(syncIds).size).toBe(syncIds.length)
    expect(new Set(INITIAL_MERCH_PRODUCTS.map((product) => product.slug)).size).toBe(INITIAL_MERCH_PRODUCTS.length)
    for (const id of ids) expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  })

  it('uses plain product names as slugs, never revision markers', () => {
    // Slugs are permanent public URLs. Revisions belong in design keys and photo names.
    for (const product of INITIAL_MERCH_PRODUCTS) {
      expect(product.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(product.slug).not.toMatch(/-(v\d+|new|old|final|draft|test|copy|alt|rev\d*|\d{4,})$/)
    }
  })

  it('keeps the approved pair on its existing photos after the slug rename', () => {
    const mug = INITIAL_MERCH_PRODUCTS.find(product => product.slug === 'moltology-mug')!
    const tee = INITIAL_MERCH_PRODUCTS.find(product => product.slug === 'moltology-tee')!
    expect(mug.featuredImageUrl).toBe('images/merch/moltology-mug-v2-1.jpg')
    expect(tee.featuredImageUrl).toBe('images/merch/moltology-tee-v2-black.jpg')
  })

  it('keeps images as bucket keys', () => {
    for (const product of INITIAL_MERCH_PRODUCTS) {
      expect(product.featuredImageUrl).toMatch(/^images\/merch\/.+\.jpg$/)
      for (const variant of product.variants) expect(variant.imageUrl).toMatch(/^images\/merch\//)
    }
  })

  it('applies recorded Printful ids over placeholders', () => {
    const [mug] = INITIAL_MERCH_PRODUCTS
    const variant = { ...mug.variants[0], printfulSyncVariantId: 920001 }
    expect(isPlaceholderSyncId(variant.printfulSyncVariantId)).toBe(true)
    const [synced] = withPrintfulSync([{ ...mug, variants: [variant] }], { [variant.id]: { syncVariantId: 4123456789 } })
    expect(synced.variants[0].printfulSyncVariantId).toBe(4123456789)
    expect(isPlaceholderSyncId(4123456789)).toBe(false)
  })

  it('builds the store view without Printful fields', () => {
    const view = merchCatalogView()
    expect(view.map((product) => product.category)).toContain('Mugs')
    expect(view.map((product) => product.category)).toContain('Tees')
    expect(view[0].variants[0]).not.toHaveProperty('printfulSyncVariantId')
  })
})
