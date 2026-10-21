#!/usr/bin/env node
/**
 * Merch catalog tooling. The catalog lives in src/lib/merch-seed-data.ts, print designs in
 * scripts/merch/designs.ts. See .agents/skills/merch-manager/SKILL.md and docs/merch-launch.md.
 *
 *   npm run merch -- check                 Validate the catalog and list what still needs a Printful sync
 *   npm run merch -- print [--pilot] [--only key|slug]    Render print files to tmp/merch/print/
 *   npm run merch -- mockups [--only slug] Generate Printful product photos to tmp/merch/mockups/
 *   npm run merch -- gallery --pilot     Download extra official views to tmp/merch/official-gallery/
 *   npm run merch -- upload                Upload print files and mockups to the bucket
 *   npm run merch -- blanks                Show the Printful blanks and their variants (needs PRINTFUL_API_TOKEN)
 *   npm run merch -- sync [--dry-run]      Create Printful products and record their ids
 *   npm run merch -- seed                  Write the catalog into the database
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { MERCH_PRINT_PREFIX, PRINTFUL_BLANKS, type MerchSeedProduct } from '../src/lib/merch-seed-data'
import { getAbsoluteAssetUrl } from '../src/lib/assets'
import { MERCH_DESIGNS, getMerchDesign } from './merch/designs'
import { renderPrintFile, renderReference } from './merch/render'
import { selectMerchProducts, productAssetKeys } from './merch/selection'
import { variantTemplate } from './merch/templates'
import { requireMerchDevDatabase } from './merch/database'
import { merchDoctor } from './merch/doctor'
import { generatePrintfulMockups } from './merch/mockups'
import { generateOfficialGallery } from './merch/gallery'
import { isCuratedMerchImage } from '../src/lib/merch-gallery'
import { PrintfulClient, buildSyncProductPayload, ensureSyncProduct, validateSyncProduct, unsyncedVariants, type SyncFile } from './merch/printful-sync'

const OUT = path.resolve('tmp/merch')
const PRINT_DIR = path.join(OUT, 'print')
const MOCKUP_DIR = path.join(OUT, 'mockups')
const CACHE_DIR = path.join(OUT, 'cache')
const SYNC_FILE = path.resolve('content/merch/printful-sync.json')

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  if (index === -1) return undefined
  const next = process.argv[index + 1]
  return next && !next.startsWith('--') ? next : 'true'
}

/** Mockup images a product needs: its featured image plus gallery, by bucket key. */
export function mockupJobs(product: MerchSeedProduct) {
  const keys = [...new Set([product.featuredImageUrl, ...product.galleryImageUrls])].filter(key => !isCuratedMerchImage(key))
  return keys.map((key, index) => {
    const variant =
      product.variants.find((item) => item.imageUrl === key) ?? product.variants[0]
    return { key, variant, angle: index === 0 ? 'front' : 'back' }
  })
}

function selected() { return selectMerchProducts(flag('only'), flag('pilot') === 'true') }

function check() {
  const problems: string[] = []
  const ids = new Set<string>()
  const syncIds = new Set<number>()
  const slugs = new Set<string>()
  for (const product of selected()) {
    if (slugs.has(product.slug)) problems.push(`Duplicate slug ${product.slug}`)
    slugs.add(product.slug)
    for (const id of [product.id, ...product.variants.map((variant) => variant.id)]) {
      if (ids.has(id)) problems.push(`Duplicate id ${id}`)
      ids.add(id)
    }
    for (const variant of product.variants) {
      if (syncIds.has(variant.printfulSyncVariantId)) problems.push(`Duplicate Printful id on ${variant.id}`)
      syncIds.add(variant.printfulSyncVariantId)
      if (!getMerchDesign(variant.design)) problems.push(`${product.slug} ${variant.title}: unknown design ${variant.design}`)
      if (variant.priceCents < 500) problems.push(`${product.slug} ${variant.title}: price looks wrong`)
    }
  }
  for (const product of selected()) {
    const prices = product.variants.map((variant) => variant.priceCents)
    console.log(
      `${product.isPublished ? '●' : '○'} ${product.title.padEnd(22)} ${product.category.padEnd(5)} ` +
        `${product.variants.length} variants  $${Math.min(...prices) / 100}–$${Math.max(...prices) / 100}`,
    )
  }
  const unsynced = unsyncedVariants(selected())
  console.log(`\n${unsynced.length} variants still use placeholder Printful ids.`)
  if (problems.length) {
    console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  console.log('Catalog is consistent.')
}

async function print() {
  const only = flag('only')
  const designKeys = new Set(only && getMerchDesign(only) && !flag('pilot') ? [only] : selected().flatMap(product => product.variants.map(variant => variant.design)))
  const designs = MERCH_DESIGNS.filter(design => designKeys.has(design.key))
  for (const design of designs) {
    const out = path.join(PRINT_DIR, `${design.key}.png`)
    await renderPrintFile(design, out, CACHE_DIR)
    console.log(`✓ ${design.key} → ${path.relative(process.cwd(), out)}`)
  }
}

function mockupPrompt(product: MerchSeedProduct, color: string | null, angle: string, body: string): string {
  const backdrop =
    'Seamless deep blue-black studio backdrop (#0b1114) with a faint cyan rim light from the upper left and a soft shadow underneath. ' +
    'Square composition, product centered and filling about 70% of the frame, shot like a premium electronics store photo. No text other than the printed artwork, no props, no hands.'
  if (product.category === 'Mugs') {
    const handle = angle === 'front' ? 'handle on the right' : 'handle on the left'
    return (
      `Photorealistic product photo of a glossy ${body} 11 oz ceramic mug, straight-on side view, ${handle}. ` +
      `The whole mug body, handle included, is ${body}, the same color as the reference background. The reference artwork is printed centered on the side facing the camera, fully visible and not cut off by the curve or the handle. ` +
      `Reproduce the printed artwork exactly: same shapes, colors and lettering, no extra marks. ${backdrop}`
    )
  }
  return (
    `Photorealistic product photo of a plain ${color?.toLowerCase()} heavyweight cotton crew-neck t-shirt, front view, neatly laid flat with gentle natural folds. ` +
    `The reference image is the front print, printed on the shirt by direct-to-garment; place it exactly where it sits in the reference relative to the chest, and reproduce it exactly with no extra marks. ${backdrop}`
  )
}

async function placeholderMockups() {
  const model = flag('model') ?? 'nano-banana-pro'
  const { generateGeminiImage } = await import('./generate-image')
  fs.mkdirSync(MOCKUP_DIR, { recursive: true })
  for (const product of selected()) {
    for (const job of mockupJobs(product)) {
      const design = getMerchDesign(job.variant.design)
      if (!design) throw new Error(`Unknown design ${job.variant.design}`)
      const printFile = path.join(PRINT_DIR, `${design.key}.png`)
      if (!fs.existsSync(printFile)) await renderPrintFile(design, printFile, CACHE_DIR)
      const blankColor = design.background ?? job.variant.colorHex ?? '#ffffff'
      fs.mkdirSync(path.join(OUT, 'refs'), { recursive: true })
      fs.mkdirSync(path.join(OUT, 'raw'), { recursive: true })
      const half = design.blank === 'mug' ? (job.angle === 'front' ? 'left' : 'right') : undefined
      const reference = await renderReference(
        printFile,
        blankColor,
        path.join(OUT, 'refs', `${design.key}-${blankColor.slice(1)}${half ? `-${half}` : ''}.jpg`),
        half,
      )
      const raw = path.join(OUT, 'raw', `${path.basename(job.key, '.jpg')}.png`)
      await generateGeminiImage({
        prompt: mockupPrompt(product, job.variant.color, job.angle, blankColor.toLowerCase() === '#ffffff' ? 'pure white' : 'deep black'),
        referenceImagePath: reference,
        model,
        aspectRatio: '1:1',
        imageSize: '2K',
        outputFilePath: raw,
      })
      const out = path.join(MOCKUP_DIR, path.basename(job.key))
      await sharp(raw).resize(1600, 1600, { fit: 'cover' }).jpeg({ quality: 84, mozjpeg: true }).toFile(out)
      console.log(`✓ ${job.key}`)
    }
  }
}

async function upload() {
  const { uploadLocalFileToS3 } = await import('../src/lib/ingest/s3-upload')
  const keys = productAssetKeys(selected())
  const kind = flag('kind') ?? 'all'
  if (!['all', 'print', 'mockups'].includes(kind)) throw new Error('--kind must be print, mockups or all.')
  const jobs = [
    ...(kind !== 'mockups' ? keys.print.map(key => ({ key, local: path.join(PRINT_DIR, path.basename(key)) })) : []),
    ...(kind !== 'print' ? keys.mockups.map(key => ({ key, local: path.join(MOCKUP_DIR, path.basename(key)) })) : []),
  ]
  for (const job of jobs) if (!fs.existsSync(job.local)) throw new Error(`Missing ${job.local}; no uploads started.`)
  for (const job of jobs) {
    await uploadLocalFileToS3(job.local, job.key)
    console.log(`✓ ${job.key}`)
  }
}

async function mockups() {
  if (flag('provider') === 'gemini') return placeholderMockups()
  if (flag('provider') && flag('provider') !== 'printful') throw new Error('--provider must be printful or gemini.')
  await generatePrintfulMockups(printfulClient(), selected(), OUT, flag('refresh') === 'true')
}

async function gallery() {
  if (!flag('only') && !flag('pilot')) throw new Error('Select existing products with --only or --pilot.')
  await generateOfficialGallery(printfulClient(), selected(), OUT, flag('groups')?.split('|').map(group => group.trim()), flag('refresh') === 'true')
}

async function templates() {
  const client = printfulClient()
  for (const product of selected()) {
    const blanks = await client.catalogProduct(product.printful.catalogProductId)
    const info = await client.printfiles(product.printful.catalogProductId)
    for (const variant of product.variants) {
      const { template, design } = variantTemplate(product, variant, blanks.variants, info)
      console.log(`✓ ${product.slug} ${variant.title}: ${design.width}x${design.height}, template ${template.width}x${template.height} at ${template.dpi} dpi`)
    }
  }
}

function printfulClient(): PrintfulClient {
  const token = process.env.PRINTFUL_API_TOKEN?.trim()
  if (!token) {
    console.error('PRINTFUL_API_TOKEN is not set. Create a Printful API token (see docs/merch-launch.md).')
    process.exit(1)
  }
  return new PrintfulClient(token, process.env.PRINTFUL_STORE_ID?.trim() || undefined)
}

async function blanks() {
  const client = printfulClient()
  for (const [name, id] of Object.entries(PRINTFUL_BLANKS)) {
    const product = await client.catalogProduct(id)
    console.log(`\n${name}: #${id} ${product.title}`)
    for (const variant of product.variants.slice(0, 40)) {
      console.log(`  ${String(variant.id).padEnd(7)} ${variant.color ?? ''} ${variant.size ?? ''}`)
    }
  }
}

function readSyncFile(): SyncFile & Record<string, unknown> {
  return JSON.parse(fs.readFileSync(SYNC_FILE, 'utf8'))
}

async function sync() {
  const dryRun = flag('dry-run') === 'true'
  const client = printfulClient()
  const storeId = await client.requireManualStore()
  const file = readSyncFile()
  if (file.storeId && file.storeId !== storeId) throw new Error('Sync ledger belongs to a different Printful store.')
  file.storeId = storeId
  if (flag('force')) throw new Error('--force recreation is disabled. Add a new design/product instead.')
  const catalogCache = new Map<number, Awaited<ReturnType<PrintfulClient['catalogProduct']>>>()

  for (const product of selected().filter(item => item.isPublished)) {
    const blankId = product.printful.catalogProductId
    if (!catalogCache.has(blankId)) catalogCache.set(blankId, await client.catalogProduct(blankId))
    const info = await client.printfiles(blankId)
    for (const variant of product.variants) variantTemplate(product, variant, catalogCache.get(blankId)!.variants, info)
    const { payload, missing } = buildSyncProductPayload({
      product,
      catalogVariants: catalogCache.get(blankId)!.variants,
      printFileUrl: (design) => getAbsoluteAssetUrl(`${MERCH_PRINT_PREFIX}/${design}.png`),
      thumbnailUrl: getAbsoluteAssetUrl(product.featuredImageUrl),
    })
    if (missing.length) {
      console.error(`✗ ${product.slug}: no Printful blank for ${missing.join(', ')}`)
      process.exit(1)
    }
    if (dryRun) {
      console.log(`~ ${product.slug}: would create ${payload.sync_variants.length} variants`)
      continue
    }
    const detail = await ensureSyncProduct(client, product.id, payload)
    validateSyncProduct(detail, payload.sync_variants)
    const created = detail.sync_product
    file.products[product.slug] = { syncProductId: created.id, syncedAt: new Date().toISOString() }
    for (const variant of detail.sync_variants) {
      file.variants[variant.external_id] = { syncVariantId: variant.id, catalogVariantId: variant.variant_id }
    }
    const temporary = `${SYNC_FILE}.tmp`
    fs.writeFileSync(temporary, `${JSON.stringify({ ...file, syncedAt: new Date().toISOString() }, null, 2)}\n`)
    fs.renameSync(temporary, SYNC_FILE)
    console.log(`✓ ${product.slug}: Printful product ${created.id}, ${detail.sync_variants.length} variants`)
  }
  if (!dryRun) console.log('\nCommit content/merch/printful-sync.json, then run `npm run merch -- seed`.')
}

async function seed() {
  const { neon } = await import('@neondatabase/serverless')
  const { drizzle } = await import('drizzle-orm/neon-http')
  const schema = await import('../src/db/schema')
  const { seedMerchCatalog } = await import('../src/db/seed-merch')
  const url = requireMerchDevDatabase(process.env)
  const products = selected()
  if (unsyncedVariants(products).length) throw new Error('Sync every selected variant before seeding. No database writes started.')
  const count = await seedMerchCatalog(drizzle(neon(url), { schema }), products, !flag('only') && !flag('pilot'))
  console.log(`✓ Seeded ${count} merch products`)
}

async function listen() {
  const { listenForStripe } = await import('./merch/stripe-listener')
  await listenForStripe(flag('configure-only') === 'true')
}

async function promote() {
  await (await import('./merch/promote')).promoteStoreCatalog({ execute: flag('execute') === 'true', endpoint: flag('target-endpoint') ?? '', authorization: flag('authorization') ?? '' })
}

async function doctor() { if (!await merchDoctor(selected(), flag('live') ? 'live' : 'test')) process.exitCode = 1 }

async function orders() {
  requireMerchDevDatabase(process.env)
  const { getDb } = await import('../src/db')
  const { merchOrders } = await import('../src/db/schema')
  const { eq, desc } = await import('drizzle-orm')
  const id = flag('order')
  const db = getDb()
  const rows = await db.select({ id: merchOrders.id, status: merchOrders.fulfillmentStatus, printfulOrderId: merchOrders.printfulOrderId, error: merchOrders.fulfillmentError, updatedAt: merchOrders.updatedAt }).from(merchOrders)
    .where(id ? eq(merchOrders.id, id) : undefined).orderBy(desc(merchOrders.updatedAt)).limit(25)
  for (const row of rows) console.log(JSON.stringify(row))
}

async function retry() {
  requireMerchDevDatabase(process.env)
  const id = flag('order')
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) throw new Error('Use retry --order <order UUID>.')
  const { retryMerchOrder } = await import('../src/lib/server/merch')
  await retryMerchOrder(id)
  await orders()
}

const COMMANDS: Record<string, () => void | Promise<void>> = { check, doctor, promote, templates, print, mockups, gallery, upload, blanks, sync, seed, orders, retry, listen }

if (process.argv[1]?.includes('merch.ts')) {
  const command = process.argv[2]
  const run = command ? COMMANDS[command] : undefined
  if (!run) {
    console.log(`Usage: npm run merch -- <${Object.keys(COMMANDS).join('|')}>`)
    process.exit(command ? 1 : 0)
  }
  Promise.resolve(run()).catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
