#!/usr/bin/env node
/** Reuse factual site screenshots; publish originals before changing email references. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'

const root = fileURLToPath(new URL('../', import.meta.url))
const manifestKey = 'src/emails/components/feature-assets.json'
export const FEATURES = ['dashboard', 'oracle', 'forum']
const revisionOf = (bytes) => createHash('sha256').update(bytes).digest('hex').slice(0, 12)
export const publicImageUrl = (asset) => `https://moltology.org/media/${asset.key}${asset.revision ? `?v=${asset.revision}` : ''}`

export function needsEmailRefresh(targets) {
  return targets.some((target) => FEATURES.some((feature) => target.outputBase === `${feature}_feature_preview`))
}

export async function buildImages(projectRoot = root) {
  const directory = path.join(projectRoot, 'tmp/email-features')
  await fs.mkdir(directory, { recursive: true })
  const manifest = {}
  for (const feature of FEATURES) {
    const source = path.join(projectRoot, `public/images/marketing/${feature}_feature_preview.webp`)
    const image = await sharp(source).resize(860, 430, { fit: 'cover', position: 'north' })
      .jpeg({ quality: 85, mozjpeg: true }).toBuffer()
    const revision = revisionOf(image)
    const key = `images/email/welcome-${feature}-${revision}.jpg`
    await fs.writeFile(path.join(directory, path.basename(key)), image)
    manifest[feature] = { key, revision, width: 860, height: 430 }
    console.log(`${path.basename(key)} (${image.length} bytes)`)
  }
  // Retry metadata stays beside the JPEGs; the live manifest is untouched until publication succeeds.
  await fs.writeFile(path.join(directory, 'feature-assets.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  return manifest
}

export async function verifyImage(asset, fetchImage = fetch) {
  const url = publicImageUrl(asset)
  const response = await fetchImage(url, { signal: AbortSignal.timeout(20000) })
  const format = asset.key.endsWith('.jpg') ? 'jpeg' : 'png'
  if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== `image/${format}`) {
    throw new Error(`Email image unavailable or wrong content type: ${url} (${response.status})`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  // Decode the pixels as well as reading metadata: an HTTP 200 can still be a broken image.
  const { info } = await sharp(bytes).raw().toBuffer({ resolveWithObject: true })
  const revision = asset.revision || asset.key.match(/-([a-f0-9]{12})\.(png|jpg)$/)?.[1]
  if (info.width !== asset.width || info.height !== asset.height || (revision && revisionOf(bytes) !== revision)) {
    throw new Error(`Email image dimensions/content differ from manifest: ${url}`)
  }
  console.log(`Verified ${url}`)
}

export async function verifyManifest(manifest, fetchImage = fetch) {
  for (const asset of Object.values(manifest)) await verifyImage(asset, fetchImage)
}

export async function publishImages(manifest, {
  projectRoot = root,
  upload = (file, key) => execFileSync('npm', ['run', 's3:upload', '--', file, '--key', key], { cwd: projectRoot, stdio: 'inherit' }),
  fetchImage = fetch,
} = {}) {
  for (const asset of Object.values(manifest)) {
    await upload(path.join(projectRoot, 'tmp/email-features', path.basename(asset.key)), asset.key)
  }
  await verifyManifest(manifest, fetchImage)
  // No new production references on partial upload, wrong bytes, or CDN failure.
  const destination = path.join(projectRoot, manifestKey)
  await fs.writeFile(`${destination}.tmp`, `${JSON.stringify(manifest, null, 2)}\n`)
  await fs.rename(`${destination}.tmp`, destination)
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => !['--publish', '--verify', '--check'].includes(arg)) || args.length > 1) {
    throw new Error('Usage: npm run email:images -- [--publish | --verify | --check]')
  }
  const current = JSON.parse(await fs.readFile(path.join(root, manifestKey), 'utf8'))
  if (args.includes('--verify')) {
    await verifyManifest(current)
    const brand = JSON.parse(await fs.readFile(path.join(root, 'src/emails/components/brand-asset.json'), 'utf8'))
    // Brand manifest dimensions are logical; build-email-brand exports a 3x PNG.
    await verifyImage({ ...brand, width: brand.width * 3, height: brand.height * 3 })
    return
  }
  const candidate = await buildImages()
  if (args.includes('--publish')) {
    await publishImages(candidate)
  } else if (args.includes('--check')) {
    if (JSON.stringify(candidate) !== JSON.stringify(current)) throw new Error('Welcome screenshots are stale. Run npm run email:images -- --publish before releasing the new manifest.')
  } else {
    console.log('Local JPEGs staged in tmp/email-features/. Email manifest preserved. Publish with npm run email:images -- --publish.')
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error); process.exitCode = 1 })
}
