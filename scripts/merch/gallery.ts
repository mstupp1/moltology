import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { getAbsoluteAssetUrl } from '../../src/lib/assets'
import { MERCH_PRINT_PREFIX, type MerchSeedProduct } from '../../src/lib/merch-seed-data'
import { PrintfulClient, type MockupTask } from './printful-sync'
import { variantTemplate } from './templates'
import { requireCompletedMockups } from './mockups'

export function galleryShots(task: MockupTask) {
  return requireCompletedMockups(task).flatMap(result => [
    { url: result.mockup_url, title: 'Primary', variantIds: result.variant_ids },
    ...(result.extra ?? []).map(extra => ({ url: extra.url, title: extra.title ?? extra.option ?? 'Extra', variantIds: result.variant_ids })),
  ]).filter((shot, index, shots) => shots.findIndex(other => other.url === shot.url) === index)
}

/** A separate, resumable library; never overwrites the catalog's approved primary photos. */
export async function generateOfficialGallery(client: PrintfulClient, products: MerchSeedProduct[], out: string, groups?: string[], refresh = false) {
  const storeId = await client.requireManualStore()
  const root = path.join(out, 'official-gallery', String(storeId))
  fs.mkdirSync(root, { recursive: true })
  for (const product of products) {
    const info = await client.printfiles(product.printful.catalogProductId)
    const blanks = await client.catalogProduct(product.printful.catalogProductId)
    const selectedGroups = groups ?? (product.category === 'Mugs' ? ['Default'] : product.category === 'Tees' ? ['Flat 2', 'Ghost'] : ['Flat'])
    for (const group of selectedGroups) if (!info.option_groups?.includes(group)) throw new Error(`${product.slug}: unavailable mockup group ${group}. Available: ${info.option_groups?.join(' | ')}`)
    const folder = path.join(root, product.slug)
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(path.join(folder, 'available-styles.json'), JSON.stringify({ groups: info.option_groups, options: info.options }, null, 2))
    for (const design of new Set(product.variants.map(variant => variant.design))) {
      const variants = product.variants.filter(variant => variant.design === design)
      // Each design/color gets a representative size; mugs have separate per-size designs.
      const variant = variants.find(variant => variant.size === 'M') ?? variants[0]
      const template = variantTemplate(product, variant, blanks.variants, info)
      for (const group of selectedGroups) {
        const stem = `${design}-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        const record = path.join(folder, `${stem}.task.json`)
        let task: MockupTask
        if (fs.existsSync(record) && !refresh) task = JSON.parse(fs.readFileSync(record, 'utf8'))
        else {
          const created = await client.createMockupTask(product.printful.catalogProductId, {
            variant_ids: [template.blank.id], format: 'jpg', width: 1600, option_groups: [group],
            ...(product.printful.options ? { product_options: Object.fromEntries(product.printful.options.map(option => [option.id, option.value])) } : {}),
            files: [{ placement: product.printful.placement, image_url: getAbsoluteAssetUrl(`${MERCH_PRINT_PREFIX}/${design}.png`),
              position: { area_width: template.template.width, area_height: template.template.height, width: template.template.width, height: template.template.height, top: 0, left: 0 } }],
          })
          task = { task_key: created.task_key, status: 'pending' }
          fs.writeFileSync(record, JSON.stringify(task, null, 2))
        }
        for (let attempt = 0; task.status === 'pending' && attempt < 30; attempt++) {
          task = await client.mockupTask(task.task_key)
          fs.writeFileSync(record, JSON.stringify(task, null, 2))
          if (task.status === 'pending') await new Promise(resolve => setTimeout(resolve, 5000))
        }
        const shots = galleryShots(task)
        const manifest = []
        for (const [index, shot] of shots.entries()) {
          const filename = `${stem}-${index + 1}.jpg`
          const target = path.join(folder, filename)
          if (!fs.existsSync(target) || refresh) {
            const response = await fetch(shot.url, { signal: AbortSignal.timeout(30_000) })
            if (!response.ok) throw new Error(`Official gallery download failed (${response.status}); rerun to resume, or --refresh for expired URLs.`)
            await sharp(Buffer.from(await response.arrayBuffer())).jpeg({ quality: 94 }).toFile(`${target}.tmp`)
            fs.renameSync(`${target}.tmp`, target)
          }
          manifest.push({ ...shot, filename, provider: 'printful', group, design, size: variant.size, color: variant.color })
        }
        fs.writeFileSync(path.join(folder, `${stem}.manifest.json`), JSON.stringify(manifest, null, 2))
        console.log(`✓ ${product.slug} / ${group}: ${shots.length} official photos`)
      }
    }
  }
}
