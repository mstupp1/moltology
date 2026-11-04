import { variantPrintFiles, type MerchSeedProduct, type MerchSeedVariant, type MerchPrintFile } from '../../src/lib/merch-seed-data'
import { getMerchDesign } from './designs'
import { matchCatalogVariant, type PrintfileInfo, type PrintfulCatalogVariant } from './printful-sync'

export function variantTemplate(product: MerchSeedProduct, variant: MerchSeedVariant, blanks: PrintfulCatalogVariant[], info: PrintfileInfo, file: MerchPrintFile = variantPrintFiles(product, variant)[0]) {
  const blank = matchCatalogVariant(blanks, variant, product.category !== 'Mugs')
  const id = info.variant_printfiles.find(item => item.variant_id === blank?.id)?.placements[file.placement]
  const template = info.printfiles.find(item => item.printfile_id === id)
  const design = getMerchDesign(file.design)
  if (!blank || !template || !design) throw new Error(`Missing Printful template for ${product.slug}: ${variant.title}.`)
  const ratioError = Math.abs((design.width / design.height) / (template.width / template.height) - 1)
  if (ratioError > 0.005 || design.width < template.width || design.height < template.height) {
    throw new Error(`Print dimensions do not match Printful template for ${file.design}.`)
  }
  return { blank, template, design }
}

export function variantTemplates(product: MerchSeedProduct, variant: MerchSeedVariant, blanks: PrintfulCatalogVariant[], info: PrintfileInfo) {
  const files = variantPrintFiles(product, variant)
  if (new Set(files.map(file => file.placement)).size !== files.length) throw new Error(`Duplicate print placement for ${product.slug}.`)
  return files.map(file => ({ ...variantTemplate(product, variant, blanks, info, file), placement: file.placement }))
}
