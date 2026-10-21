import { INITIAL_MERCH_PRODUCTS, MERCH_PILOT_SLUGS, type MerchSeedProduct } from '../../src/lib/merch-seed-data'
import { isCuratedMerchImage } from '../../src/lib/merch-gallery'

export function selectMerchProducts(only?: string, pilot = false): MerchSeedProduct[] {
  if (only && pilot) throw new Error('Use --only or --pilot, not both.')
  const slugs = pilot ? [...MERCH_PILOT_SLUGS] : only?.split(',').map(item => item.trim())
  if (!slugs) return INITIAL_MERCH_PRODUCTS
  if (slugs.some(slug => !INITIAL_MERCH_PRODUCTS.some(product => product.slug === slug))) {
    throw new Error('Unknown product selection. Use exact catalog slugs with --only slug,slug or --pilot.')
  }
  return INITIAL_MERCH_PRODUCTS.filter(product => slugs.includes(product.slug))
}

/** Build an exact upload allowlist; never enumerate stale output folders. */
export function productAssetKeys(products: MerchSeedProduct[]) {
  return {
    print: [...new Set(products.flatMap(product => product.variants.map(variant => `merch/print/${variant.design}.png`)))],
    mockups: [...new Set(products.flatMap(product => [product.featuredImageUrl, ...product.galleryImageUrls, ...product.variants.map(variant => variant.imageUrl).filter((key): key is string => Boolean(key))]))].filter(key => !isCuratedMerchImage(key)),
  }
}
