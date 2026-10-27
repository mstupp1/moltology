#!/usr/bin/env node
/** Reuse the site's factual feature screenshots as email-safe JPEG card headers. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import sharp from 'sharp'

const root = fileURLToPath(new URL('../', import.meta.url))
const directory = path.join(root, 'tmp/email-features')
await fs.mkdir(directory, { recursive: true })
const manifest = {}
for (const feature of ['dashboard', 'oracle', 'forum']) {
  const source = path.join(root, `public/images/marketing/${feature}_feature_preview.webp`)
  const image = await sharp(source).resize(860, 430, { fit: 'cover', position: 'north' })
    .jpeg({ quality: 85, mozjpeg: true }).toBuffer()
  const revision = createHash('sha256').update(image).digest('hex').slice(0, 12)
  const key = `images/email/welcome-${feature}-${revision}.jpg`
  await fs.writeFile(path.join(directory, path.basename(key)), image)
  manifest[feature] = { key, revision, width: 860, height: 430 }
  console.log(`${path.join(directory, path.basename(key))} → ${key} (${image.length} bytes)`)
}
await fs.writeFile(path.join(root, 'src/emails/components/feature-assets.json'), `${JSON.stringify(manifest, null, 2)}\n`)
