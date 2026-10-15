#!/usr/bin/env node
/** Check reproducibility, legacy backups, offline references and icon formats. */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import tailwind from '../tailwind.config.js'
import { ICON_LAYOUT, brandRevision, makePalettes, parsePart } from './build-brand-assets.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const KIT = path.join(ROOT, 'content/brand/synaptic-path')
const read = (file) => fs.readFile(path.join(ROOT, file), 'utf8')
const colors = tailwind.theme.extend.colors
const palettes = makePalettes(colors)
const generated = JSON.parse(await read('src/components/ui/brand-geometry.json'))
const parts = {}
for (const name of Object.keys(generated.parts)) parts[name] = parsePart(await fs.readFile(path.join(KIT, 'parts', `${name}.svg`), 'utf8'))
assert.deepEqual(parts, generated.parts, 'SVG parts changed: run npm run brand:build')
assert.deepEqual(JSON.parse(await fs.readFile(path.join(KIT, 'palettes.json'), 'utf8')), palettes, 'HUD colors changed: run npm run brand:build')
const version = brandRevision(parts, palettes, colors)
assert.equal(generated.version, version)
const metadata = JSON.parse(await read('src/components/ui/brand-assets.json'))
assert.equal(metadata.version, version)
assert.deepEqual(metadata.layout, ICON_LAYOUT)

const backups = JSON.parse(await fs.readFile(path.join(KIT, 'legacy/manifest.json'), 'utf8'))
for (const file of backups.files) {
  const bytes = await fs.readFile(path.join(KIT, 'legacy', file.backup))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256, `Legacy backup changed: ${file.backup}`)
}

for (const layout of ['horizontal', 'stacked']) for (const subtitle of ['foundation', 'benthic', 'none']) for (const [palette, colors] of Object.entries(palettes)) {
  const name = `${layout}-${subtitle}-${palette}.svg`
  const svg = await fs.readFile(path.join(KIT, 'lockups', name), 'utf8')
  assert(!/<(?:image|script|text|foreignObject)\b|\bhref=/i.test(svg), `Non-vector dependency: ${name}`)
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, new Set(ids).size, `Duplicate IDs: ${name}`)
  for (const role of subtitle === 'none' ? ['icon', 'primary'] : ['icon', 'primary', 'secondary']) {
    assert(svg.includes(`id="brand-${role}"`))
    assert(svg.includes(`fill="${colors[role]}"`), `Unexpected palette: ${name}`)
  }
  const image = await loadImage(Buffer.from(svg))
  assert(image.width > 0 && image.height > 0)
}

async function pixels(file, expectedSize) {
  const image = await loadImage(await fs.readFile(path.join(ROOT, file)))
  assert.equal(image.width, expectedSize, file)
  assert.equal(image.height, expectedSize, file)
  const canvas = createCanvas(expectedSize, expectedSize)
  canvas.getContext('2d').drawImage(image, 0, 0)
  return canvas.getContext('2d').getImageData(0, 0, expectedSize, expectedSize).data
}

const icon = await pixels('public/images/order_emblem.png', 512)
assert.equal(icon[3], 0, 'Emblem canvas must remain transparent')
assert(icon.some((value, i) => i % 4 === 3 && value > 0), 'Emblem is empty')
const paintedRows = new Set()
for (let i = 0; i < icon.length; i += 4) if (icon[i+3] > 128) paintedRows.add(Math.floor(i/4/512))
const uiHeight = Math.max(...paintedRows) - Math.min(...paintedRows) + 1
assert(uiHeight >= 512*0.95 && uiHeight <= 512*0.97, 'UI emblem framing is too loose or clips the artwork')
await pixels('public/images/order_emblem.webp', 512)
// Favicons and desktop "any" icons sit on a rounded abyss tile; iOS and maskable tiles are full squares.
const hex = (value) => value.match(/\w{2}/g).map((pair) => parseInt(pair, 16))
const tileRgb = hex(colors.abyss)
const redRgb = hex(colors.crimson.aggro)
function checkTile(file, data, size, { rounded, minHeight, maxHeight, safeCircle = false }) {
  const at = (x, y) => data.subarray((y*size+x)*4, (y*size+x)*4+4)
  const near = (px, rgb, tolerance = 6) => px[3] === 255 && rgb.every((value, i) => Math.abs(px[i]-value) <= tolerance)
  if (rounded) assert(at(0, 0)[3] < 64 && at(size-1, size-1)[3] < 64, `${file}: tile corners must be rounded and transparent`)
  else for (let i = 3; i < data.length; i += 4) assert.equal(data[i], 255, `${file}: tile must be opaque`)
  for (const [x, y] of [[0, size>>1], [size>>1, 0], [size-1, size>>1], [size>>1, size-1]]) assert(near(at(x, y), tileRgb), `${file}: tile must reach the canvas edge in abyss`)
  let minY = size, maxY = -1
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = at(x, y)
    if (px[3] < 128 || px[0]-px[1] < (redRgb[0]-redRgb[1])/2) continue
    minY = Math.min(minY, y)
    maxY = Math.max(maxY, y)
    if (safeCircle) assert(Math.hypot(x+0.5-size/2, y+0.5-size/2) < size*0.4, `${file}: emblem crosses maskable safe circle`)
  }
  const height = (maxY-minY+1)/size
  assert(height >= minHeight && height <= maxHeight, `${file}: emblem fills ${(height*100).toFixed(0)}% of the tile height`)
}
const tileFit = { rounded: true, minHeight: 0.76, maxHeight: 0.84 }
const faviconFit = { rounded: true, minHeight: 0.84, maxHeight: 0.92 }
checkTile('favicon.png', await pixels('public/favicon.png', 64), 64, faviconFit)
assert.match(await read('public/favicon.svg'), new RegExp(`<rect [^>]*rx="[\\d.]+" fill="${colors.abyss}"/>`), 'favicon.svg must draw the rounded abyss tile')
for (const [file, size, fit] of [
  ['icon-192.png', 192, tileFit],
  ['icon-512.png', 512, tileFit],
  ['apple-touch-icon.png', 180, { minHeight: 0.8, maxHeight: 0.86 }],
  ['icon-maskable-512.png', 512, { minHeight: 0.76, maxHeight: 0.8, safeCircle: true }],
]) checkTile(file, await pixels(`public/images/pwa/${file}`, size), size, fit)
const badge = await pixels('public/images/pwa/badge-96.png', 96)
assert.equal(badge[3], 0, 'Notification badge must have a transparent canvas')
for (let i = 0; i < badge.length; i += 4) if (badge[i+3] > 128) assert(badge[i] > 250 && badge[i+1] > 250 && badge[i+2] > 250)

const ico = await fs.readFile(path.join(ROOT, 'public/favicon.ico'))
assert.equal(ico.readUInt16LE(2), 1)
assert.equal(ico.readUInt16LE(4), 3)
for (const [i, size] of [16, 32, 48].entries()) {
  const position = 6+i*16
  assert.equal(ico[position], size)
  const bytes = ico.readUInt32LE(position+8), offset = ico.readUInt32LE(position+12)
  const image = await loadImage(ico.subarray(offset, offset+bytes))
  assert.equal(image.width, size)
  const canvas = createCanvas(size, size)
  canvas.getContext('2d').drawImage(image, 0, 0)
  checkTile(`favicon.ico ${size}px`, canvas.getContext('2d').getImageData(0, 0, size, size).data, size, { ...faviconFit, minHeight: 0.8, maxHeight: 0.94 })
}
const manifest = JSON.parse(await read('public/manifest.webmanifest'))
for (const icon of manifest.icons) {
  assert(icon.src.endsWith(`?v=${version}`), 'Manifest icon version is stale')
  await fs.access(path.join(ROOT, 'public', icon.src.split('?')[0]))
}
const sw = await read('public/sw.js')
assert(new RegExp(`moltology-hub-v\\d+-brand-${version}`).test(sw), 'Service worker brand revision is stale')
const precache = sw.match(/const PRECACHE_URLS = \[([\s\S]+?)\]/)?.[1]
assert(precache)
for (const [, url] of precache.matchAll(/'([^']+)'/g)) await fs.access(path.join(ROOT, 'public', url))
console.log('Brand kit verified: 54 SVG lockups, token colors, 8 original backups, transparent emblem/badge, abyss favicon and app tiles, ICO, and offline references.')
