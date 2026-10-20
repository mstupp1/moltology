import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { getAbsoluteAssetUrl } from '../../src/lib/assets'
import { MERCH_PRINT_PREFIX, type MerchSeedProduct } from '../../src/lib/merch-seed-data'
import { PrintfulClient, type MockupTask } from './printful-sync'
import { variantTemplate } from './templates'

/** Only completed provider tasks may produce website photos. */
export function requireCompletedMockups(task: MockupTask) {
  if (task.status !== 'completed' || !task.mockups?.length) throw new Error(`Printful mockup task ${task.task_key} is ${task.status}; outputs preserved for retry.`)
  return task.mockups
}

export async function generatePrintfulMockups(client: PrintfulClient, products: MerchSeedProduct[], out: string, refresh = false) {
  const storeId = await client.requireManualStore()
  const taskDir = path.join(out, 'tasks', String(storeId))
  const mockupDir = path.join(out, 'mockups')
  fs.mkdirSync(taskDir, { recursive: true })
  fs.mkdirSync(mockupDir, { recursive: true })
  for (const product of products) {
    const blanks = await client.catalogProduct(product.printful.catalogProductId)
    const info = await client.printfiles(product.printful.catalogProductId)
    const results: NonNullable<MockupTask['mockups']> = []
    for (const designKey of new Set(product.variants.map(variant => variant.design))) {
      const variants = product.variants.filter(variant => variant.design === designKey)
      const template = variantTemplate(product, variants[0], blanks.variants, info)
      const record = path.join(taskDir, `${product.slug}-${designKey}.json`)
      let task: MockupTask
      if (fs.existsSync(record) && !refresh) task = JSON.parse(fs.readFileSync(record, 'utf8'))
      else {
        const created = await client.createMockupTask(product.printful.catalogProductId, {
          variant_ids: variants.map(variant => variantTemplate(product, variant, blanks.variants, info).blank.id),
          format: 'jpg', width: 1600,
          option_groups: [product.category === 'Mugs' ? 'Default' : 'Flat'],
          files: [{ placement: product.printful.placement, image_url: getAbsoluteAssetUrl(`${MERCH_PRINT_PREFIX}/${designKey}.png`),
            position: { area_width: template.template.width, area_height: template.template.height,
              width: template.template.width, height: template.template.height, top: 0, left: 0 } }],
        })
        task = { task_key: created.task_key, status: 'pending' }
        fs.writeFileSync(record, JSON.stringify(task, null, 2))
      }
      // Persist the task key before polling so interruption is resumable.
      for (let attempt = 0; task.status === 'pending' && attempt < 30; attempt++) {
        task = await client.mockupTask(task.task_key)
        fs.writeFileSync(record, JSON.stringify(task, null, 2))
        if (task.status === 'pending') {
          console.log(`Waiting for Printful mockups: ${product.slug} ${designKey}`)
          await new Promise(resolve => setTimeout(resolve, 5000))
        }
      }
      results.push(...requireCompletedMockups(task))
    }
    const keys = [...new Set([product.featuredImageUrl, ...product.galleryImageUrls, ...product.variants.map(variant => variant.imageUrl).filter((key): key is string => Boolean(key))])]
    for (const [index, key] of keys.entries()) {
      const variant = product.variants.find(item => item.imageUrl === key) ?? product.variants[Math.min(index, product.variants.length - 1)]
      const blank = variantTemplate(product, variant, blanks.variants, info).blank
      const result = results.find(item => item.variant_ids.includes(blank.id))
      if (!result) throw new Error(`No Printful mockup for ${product.slug}: ${variant.title}.`)
      const url = product.category === 'Mugs' && index === 0
        ? result.extra?.find(extra => extra.title === 'Handle on Left')?.url ?? result.mockup_url
        : result.mockup_url
      const response = await fetch(url, { signal: AbortSignal.timeout(30_000) })
      if (!response.ok) throw new Error(`Printful mockup download failed (${response.status}); task record preserved.`)
      const target = path.join(mockupDir, path.basename(key))
      // Use a temporary file: download/decoding failures cannot damage a previous final image.
      await sharp(Buffer.from(await response.arrayBuffer())).resize(1600, 1600, { fit: 'contain', background: '#ffffff' }).jpeg({ quality: 90 }).toFile(`${target}.tmp`)
      fs.renameSync(`${target}.tmp`, target)
      console.log(`✓ Printful photo ${key}`)
    }
  }
}
