#!/usr/bin/env node
/** Export approved flat header emblem and greyscale footer lockup/social icons for email clients. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const root = fileURLToPath(new URL('../', import.meta.url))
const scale = 3
const mutedColor = '#8fa0a0'

const hashOf = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 12)

async function writeBrandPng(name, png) {
  const revision = hashOf(png)
  const key = `images/email/${name}-${revision}.png`
  const output = path.join(root, 'tmp/email-brand', path.basename(key))
  await fs.mkdir(path.dirname(output), { recursive: true })
  await fs.writeFile(output, png)
  return { key, output }
}

/** Centered header icon: canonical flat red emblem (parts/icon.svg) at 3x resolution. */
async function buildHeaderEmblem() {
  const size = 48
  let iconSvg = await fs.readFile(path.join(root, 'content/brand/synaptic-path/parts/icon.svg'), 'utf8')
  iconSvg = iconSvg.replace(/<svg\b[^>]*>/, (tag) => tag
    .replace(/\bwidth="[^"]+"/, `width="${size * scale * 4}"`)
    .replace(/\bheight="[^"]+"/, `height="${size * scale * 4}"`))
  const img = await loadImage(Buffer.from(iconSvg))
  const canvas = createCanvas(size * scale, size * scale)
  const context = canvas.getContext('2d')
  context.drawImage(img, 0, 0, canvas.width, canvas.height)
  const png = await canvas.encode('png')
  const { key, output } = await writeBrandPng('moltology-emblem-dark', png)
  console.log(`Header emblem: ${output} (${canvas.width} × ${canvas.height}, ${png.length} bytes)`)
  return { key, width: size, height: size }
}

/**
 * Greyscale (#8fa0a0) full horizontal lockup for the footer:
 * canonical emblem on the left + "Moltology / THE SYNAPTIC PATH" on the right.
 */
async function buildFooterLockup() {
  const height = 38
  const padY = 1
  const padX = 1
  const gap = 9

  let iconSvg = await fs.readFile(path.join(root, 'content/brand/synaptic-path/parts/variants/icon-inherit.svg'), 'utf8')
  iconSvg = iconSvg
    .replaceAll('currentColor', mutedColor)
    .replace(/<svg\b[^>]*>/, (tag) => tag
      .replace(/\bwidth="[^"]+"/, 'width="1200"')
      .replace(/\bheight="[^"]+"/, 'height="1200"'))
  const iconImg = await loadImage(Buffer.from(iconSvg))

  let wordmarkSvg = await fs.readFile(path.join(root, 'content/brand/synaptic-path/parts/merch-v2/moltology-stacked-dark.svg'), 'utf8')
  const origW = 1018
  const origH = 344
  wordmarkSvg = wordmarkSvg
    .replaceAll('#F3F7F5', mutedColor)
    .replaceAll('#A9B5B1', mutedColor)
    .replace(/<svg\b[^>]*>/, (tag) => tag
      .replace(/\bwidth="[^"]+"/, `viewBox="0 0 ${origW} ${origH}" width="${origW * 3}"`)
      .replace(/\bheight="[^"]+"/, `height="${origH * 3}"`))
  const wordmarkImg = await loadImage(Buffer.from(wordmarkSvg))

  const iconBoxSize = height - padY * 2
  const iconVisLeft = iconBoxSize * 0.0647
  const iconVisWidth = iconBoxSize * 0.8706

  const wordmarkTargetVisH = 33
  const wordmarkScale = wordmarkTargetVisH / 303
  const wordmarkDrawW = origW * wordmarkScale
  const wordmarkDrawH = origH * wordmarkScale
  const wordmarkVisLeft = 21 * wordmarkScale
  const wordmarkVisWidth = 972 * wordmarkScale
  const wordmarkVisTop = 21 * wordmarkScale

  const width = Math.ceil(padX * 2 + iconVisWidth + gap + wordmarkVisWidth)
  const canvas = createCanvas(width * scale, height * scale)
  const context = canvas.getContext('2d')
  context.scale(scale, scale)

  const iconDrawX = padX - iconVisLeft
  const iconDrawY = (height - iconBoxSize) / 2
  context.drawImage(iconImg, iconDrawX, iconDrawY, iconBoxSize, iconBoxSize)

  const wordmarkDrawX = padX + iconVisWidth + gap - wordmarkVisLeft
  const wordmarkDrawY = (height - wordmarkTargetVisH) / 2 - wordmarkVisTop
  context.drawImage(wordmarkImg, wordmarkDrawX, wordmarkDrawY, wordmarkDrawW, wordmarkDrawH)

  const png = await canvas.encode('png')
  const { key, output } = await writeBrandPng('moltology-lockup-muted', png)
  console.log(`Footer lockup: ${output} (${canvas.width} × ${canvas.height}, ${png.length} bytes)`)
  return { key, width, height }
}

/** Greyscale (#8fa0a0) Lucide-style social icon matching the site footer. */
async function buildSocialIcon(name, innerPaths) {
  const size = 20
  const px = size * scale * 3
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${px}" height="${px}" fill="none" stroke="${mutedColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${innerPaths}</svg>`
  const img = await loadImage(Buffer.from(svg))
  const canvas = createCanvas(size * scale, size * scale)
  const context = canvas.getContext('2d')
  context.drawImage(img, 0, 0, canvas.width, canvas.height)
  const png = await canvas.encode('png')
  const { key, output } = await writeBrandPng(`social-${name}-muted`, png)
  console.log(`Social (${name}): ${output} (${canvas.width} × ${canvas.height}, ${png.length} bytes)`)
  return { key, width: size, height: size }
}

const header = await buildHeaderEmblem()
const footerLockup = await buildFooterLockup()
const youtubeIcon = await buildSocialIcon(
  'youtube',
  '<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" />',
)
const instagramIcon = await buildSocialIcon(
  'instagram',
  '<rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />',
)

const manifest = {
  ...header,
  footerLockup,
  social: {
    youtube: youtubeIcon,
    instagram: instagramIcon,
  },
}

await fs.mkdir(path.join(root, 'src/emails/components'), { recursive: true })
await fs.writeFile(path.join(root, 'src/emails/components/brand-asset.json'), `${JSON.stringify(manifest, null, 2)}\n`)
console.log('Updated src/emails/components/brand-asset.json')
