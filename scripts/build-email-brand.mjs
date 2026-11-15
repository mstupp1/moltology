#!/usr/bin/env node
/** Export approved header/merch artwork for email clients that cannot display SVG. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import tailwind from '../tailwind.config.js'
import { getMerchDesign } from './merch/designs.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const width = 220
const scale = 3
const tee = getMerchDesign('tee-moltology-v2')
if (!tee) throw new Error('Approved Moltology T-shirt design is missing')
// Fit and position the same source layers as the tee, then crop only empty print area.
const layers = await Promise.all(tee.layers.map(async (layer) => {
  if (!('repo' in layer.source)) throw new Error('Email branding requires local vector artwork')
  let artwork = await fs.readFile(path.join(root, layer.source.repo), 'utf8')
  if (layer.source.repo.endsWith('/icon.svg')) {
    // Decode the 100px SVG above output resolution instead of upscaling its bitmap.
    artwork = artwork.replace(/<svg\b[^>]*>/, (tag) => tag
      .replace(/\bwidth="[^"]+"/, 'width="1200"')
      .replace(/\bheight="[^"]+"/, 'height="1200"'))
  }
  const image = await loadImage(Buffer.from(artwork))
  const fit = Math.min(layer.maxWidth * tee.width / image.width, layer.maxHeight * tee.height / image.height)
  const layerWidth = image.width * fit
  const layerHeight = image.height * fit
  return { image, width: layerWidth, height: layerHeight, emblem: layer.source.repo.endsWith('/icon.svg'),
    x: layer.cx * tee.width - layerWidth / 2, y: layer.cy * tee.height - layerHeight / 2 }
}))
const left = Math.min(...layers.map((layer) => layer.x))
const top = Math.min(...layers.map((layer) => layer.y))
const right = Math.max(...layers.map((layer) => layer.x + layer.width))
const bottom = Math.max(...layers.map((layer) => layer.y + layer.height))
// Room around the artwork so the emblem's glow fades out inside the plate.
const pad = 22
const reduction = (width - pad * 2) / (right - left)
const height = Math.ceil((bottom - top) * reduction + pad * 2)
const canvas = createCanvas(width * scale, height * scale)
const context = canvas.getContext('2d')
context.scale(scale, scale)
// A solid plate preserves the lettering when clients invert surrounding colors.
context.fillStyle = tailwind.theme.extend.colors.benthic.surface
context.fillRect(0, 0, width, height)
const crimson = tailwind.theme.extend.colors.crimson.aggro
for (const layer of layers) {
  const x = (layer.x - left) * reduction + pad
  const y = (layer.y - top) * reduction + pad
  const w = layer.width * reduction
  const h = layer.height * reduction
  if (layer.emblem) {
    // The emblem in its own light, as on GlowEmblem in the app and the site's link-preview card.
    const cx = x + w / 2
    const cy = y + h / 2
    const halo = context.createRadialGradient(cx, cy, 0, cx, cy, w * 0.95)
    halo.addColorStop(0, 'rgba(255, 69, 58, 0.30)')
    halo.addColorStop(0.4, 'rgba(255, 69, 58, 0.10)')
    halo.addColorStop(1, 'rgba(255, 69, 58, 0)')
    context.fillStyle = halo
    context.fillRect(0, 0, width, height)
    context.save()
    context.shadowColor = crimson
    context.shadowBlur = w * 0.22 * scale
    context.drawImage(layer.image, x, y, w, h)
    context.restore()
  } else {
    context.drawImage(layer.image, x, y, w, h)
  }
}
const png = await canvas.encode('png')
const revision = createHash('sha256').update(png).digest('hex').slice(0, 12)
const key = `images/email/moltology-lockup-dark-${revision}.png`
const output = path.join(root, 'tmp/email-brand', path.basename(key))
await fs.mkdir(path.dirname(output), { recursive: true })
await fs.writeFile(output, png)
await fs.mkdir(path.join(root, 'src/emails/components'), { recursive: true })
await fs.writeFile(path.join(root, 'src/emails/components/brand-asset.json'), `${JSON.stringify({ key, width, height }, null, 2)}\n`)
console.log(`Email logo: ${output}\nS3 key: ${key}\n${canvas.width} × ${canvas.height}, ${png.length} bytes`)
