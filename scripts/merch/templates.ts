import type { MerchSeedProduct, MerchSeedVariant } from '../../src/lib/merch-seed-data'
import { getMerchDesign } from './designs'
import { matchCatalogVariant, type PrintfileInfo, type PrintfulCatalogVariant } from './printful-sync'

export function variantTemplate(product: MerchSeedProduct, variant: MerchSeedVariant, blanks: PrintfulCatalogVariant[], info: PrintfileInfo) {
  const blank = matchCatalogVariant(blanks, variant, product.category !== 'Mugs')
  const id = info.variant_printfiles.find(item => item.variant_id === blank?.id)?.placements[product.printful.placement]
  const template = info.printfiles.find(item => item.printfile_id === id)
  const design = getMerchDesign(variant.design)
  if (!blank || !template || !design) throw new Error(`Missing Printful template for ${product.slug}: ${variant.title}.`)
  const ratioError = Math.abs((design.width / design.height) / (template.width / template.height) - 1)
  if (ratioError > 0.005 || design.width < template.width || design.height < template.height) {
    throw new Error(`Print dimensions do not match Printful template for ${variant.design}.`)
  }
  return { blank, template, design }
}
