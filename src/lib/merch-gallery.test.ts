import { describe, expect, it } from 'vitest'
import { INITIAL_MERCH_PRODUCTS } from './merch-seed-data'
import { MERCH_PRODUCT_GALLERIES, merchGalleryCaption } from './merch-gallery'
import { productAssetKeys } from '../../scripts/merch/selection'

describe('reviewed product galleries', () => {
  it('keeps official primaries first and protects curated media from mockup regeneration/uploads', () => {
    const products = INITIAL_MERCH_PRODUCTS.filter(product => product.slug in MERCH_PRODUCT_GALLERIES)
    expect(products).toHaveLength(2)
    for (const product of products) {
      expect(product.galleryImageUrls[0]).toBe(product.featuredImageUrl)
      expect(product.galleryImageUrls).toEqual(expect.arrayContaining(MERCH_PRODUCT_GALLERIES[product.slug]))
      expect(new Set(product.galleryImageUrls).size).toBe(product.galleryImageUrls.length)
    }
    expect(productAssetKeys(products).mockups.some(key => key.includes('/library/'))).toBe(false)
  })
  it('labels generated shots and actual reference sizes instead of the purchase selection', () => {
    for (const images of Object.values(MERCH_PRODUCT_GALLERIES)) {
      for (const key of images) expect(merchGalleryCaption(key)).toBeTruthy()
    }
    expect(merchGalleryCaption(MERCH_PRODUCT_GALLERIES['moltology-mug-v2'][4])).toBe('AI-generated lifestyle image.')
    expect(merchGalleryCaption(MERCH_PRODUCT_GALLERIES['moltology-mug-v2'][2])).toContain('15 oz')
    expect(merchGalleryCaption(MERCH_PRODUCT_GALLERIES['moltology-tee-v2'][0])).toContain('size M')
    expect(merchGalleryCaption('images/merch/legacy.jpg')).toBeNull()
  })
})
