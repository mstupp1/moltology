import { describe, expect, it } from 'vitest'
import { INITIAL_MERCH_PRODUCTS } from './merch-seed-data'
import { MERCH_PRODUCT_GALLERIES, MERCH_IMAGE_DESCRIPTIONS, merchGalleryAlt, merchGalleryCaption } from './merch-gallery'
import { productAssetKeys } from '../../scripts/merch/selection'

describe('reviewed product galleries', () => {
  const products = INITIAL_MERCH_PRODUCTS.filter(product => product.slug in MERCH_PRODUCT_GALLERIES)
  it('keeps the primary first and protects curated media from regeneration and uploads', () => {
    expect(products).toHaveLength(2)
    for (const product of products) {
      expect(product.galleryImageUrls[0]).toBe(product.featuredImageUrl)
      expect(product.galleryImageUrls).toEqual(expect.arrayContaining(MERCH_PRODUCT_GALLERIES[product.slug]))
      expect(new Set(product.galleryImageUrls).size).toBe(product.galleryImageUrls.length)
    }
    expect(productAssetKeys(products).mockups.some(key => key.includes('/library/'))).toBe(false)
  })
  it('describes every gallery and variant image, including the originals, without production jargon', () => {
    for (const product of products) {
      const keys = [...product.galleryImageUrls, ...product.variants.map(variant => variant.imageUrl).filter(Boolean)]
      for (const key of keys) {
        expect(merchGalleryCaption(key)).toBeTruthy()
        expect(MERCH_IMAGE_DESCRIPTIONS[key!]?.alt).toBeTruthy()
        expect(merchGalleryCaption(key)).not.toMatch(/ai|printful|mockup|size M/i)
      }
    }
    expect(merchGalleryCaption('images/merch/moltology-mug-v2-1.jpg')).toBe('11 oz mug')
    expect(merchGalleryCaption('images/merch/moltology-mug-v2-2.jpg')).toBe('15 oz mug')
    expect(merchGalleryCaption('images/merch/moltology-tee-v2-black.jpg')).toBe('Black tee · front')
    expect(merchGalleryAlt(null, 'Product')).toBe('Product')
  })
  it('keeps three square model images per product and removes redundant tee views', () => {
    for (const product of products) expect(product.galleryImageUrls.filter(key => key.includes('/square-v2/'))).toHaveLength(3)
    const tee = products.find(product => product.slug === 'moltology-tee-v2')!
    expect(tee.galleryImageUrls.some(key => /on-hanger|ghost-1/.test(key))).toBe(false)
    expect(tee.galleryImageUrls).toHaveLength(6)
  })
})
