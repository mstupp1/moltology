#!/usr/bin/env node
/** Check reproducibility, legacy backups, offline references and icon formats. */
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import tailwind from '../tailwind.config.js'
import { ICON_LAYOUT, makePalettes, parsePart } from './build-brand-assets.mjs'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const KIT = path.join(ROOT, 'content/brand/synaptic-path')
const read = (file) => fs.readFile(path.join(ROOT, file), 'utf8')
const palettes = makePalettes(tailwind.theme.extend.colors)
const generated = JSON.parse(await read('src/components/ui/brand-geometry.json'))
const parts = {}
for (const name of Object.keys(generated.parts)) parts[name] = parsePart(await fs.readFile(path.join(KIT, 'parts', `${name}.svg`), 'utf8'))
assert.deepEqual(parts, generated.parts, 'SVG parts changed: run npm run brand:build')
assert.deepEqual(JSON.parse(await fs.readFile(path.join(KIT, 'palettes.json'), 'utf8')), palettes, 'HUD colors changed: run npm run brand:build')
const version = createHash('sha256').update(JSON.stringify({ parts, palettes, layout: ICON_LAYOUT })).digest('hex').slice(0, 12)
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
await pixels('public/favicon.png', 64)
for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
  const data = await pixels(`public/images/pwa/${file}`, size)
  const bg = tailwind.theme.extend.colors.benthic.bg.match(/\w{2}/g).map((hex) => parseInt(hex, 16))
  let minY = size, maxY = -1
  for (let i = 0; i < data.length; i += 4) {
    assert.equal(data[i+3], 255, `${file}: app tile must be opaque`)
    if (data[i] > bg[0]+30 || data[i+1] > bg[1]+30 || data[i+2] > bg[2]+30) {
      const x = (i/4)%size + 0.5, y = Math.floor(i/4/size) + 0.5
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
      assert(Math.hypot(x-size/2, y-size/2) < size*0.4, `${file}: emblem crosses maskable safe circle`)
    }
  }
  assert(maxY-minY+1 > size*0.74, `${file}: app emblem is unnecessarily small`)
}
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
}
const manifest = JSON.parse(await read('public/manifest.webmanifest'))
for (const icon of manifest.icons) {
  assert(icon.src.endsWith(`?v=${version}`), 'Manifest icon version is stale')
  await fs.access(path.join(ROOT, 'public', icon.src.split('?')[0]))
}
const sw = await read('public/sw.js')
assert(sw.includes(`moltology-hub-v3-brand-${version}`), 'Service worker brand revision is stale')
const precache = sw.match(/const PRECACHE_URLS = \[([\s\S]+?)\]/)?.[1]
assert(precache)
for (const [, url] of precache.matchAll(/'([^']+)'/g)) await fs.access(path.join(ROOT, 'public', url))
console.log('Brand kit verified: 54 SVG lockups, token colors, 8 original backups, transparent emblem/badge, safe app tiles, ICO, and offline references.')
