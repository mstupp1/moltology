#!/usr/bin/env node
/** Build local UI assets and reusable exports from the approved SVG parts. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import tailwind from '../tailwind.config.js'

const PART_NAMES = ['icon', 'primary', 'secondary-benthic', 'secondary-foundation']

export function makePalettes(colors) {
  const app = colors.crimson.aggro
  const dark = { icon: app, primary: colors.ink.DEFAULT, secondary: colors.cyan.glow }
  const light = { icon: app, primary: colors.benthic.surface, secondary: colors.cyan.muted }
  const mono = (color) => ({ icon: color, primary: color, secondary: color })
  return {
    dark, light,
    'mono-dark': mono(colors.ink.DEFAULT),
    'mono-light': mono(colors.benthic.surface),
    black: mono('#000000'),
    white: mono('#ffffff'),
    inherit: mono('currentColor'),
    'reference-dark': { ...dark, icon: '#ef174c' },
    'reference-light': { ...light, icon: '#ef174c' },
  }
}

export function parsePart(svg) {
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1]
  const transform = svg.match(/<g\b[^>]*\btransform="([^"]+)"/)?.[1]
  const d = svg.match(/<path\b[^>]*\bd="([^"]+)"/)?.[1]
  if (!viewBox || !transform || !d || /<(?:image|script|text|foreignObject)\b|\bhref=/i.test(svg)) {
    throw new Error('Brand parts must be self-contained outlined SVGs')
  }
  if ((svg.match(/<path\b/g) || []).length !== 1) throw new Error('Each part must contain one compound path')
  return { viewBox, transform, d }
}

export function encodeIco(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = header.length
  for (const [i, { size, png }] of pngs.entries()) {
    if (size < 1 || size > 256) throw new Error('ICO dimensions must be between 1 and 256')
    const start = 6 + i * 16
    header[start] = header[start + 1] = size === 256 ? 0 : size
    header.writeUInt16LE(1, start + 4)
    header.writeUInt16LE(32, start + 6)
    header.writeUInt32LE(png.length, start + 8)
    header.writeUInt32LE(offset, start + 12)
    offset += png.length
  }
  return Buffer.concat([header, ...pngs.map(({ png }) => png)])
}

function iconSvg(part, color, size = 512, background, inset = 0) {
  const innerSize = size - inset * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><title>The Synaptic Path emblem</title>${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}<svg x="${inset}" y="${inset}" width="${innerSize}" height="${innerSize}" viewBox="${part.viewBox}"><g fill="${color}" transform="${part.transform}"><path fill-rule="evenodd" d="${part.d}"/></g></svg></svg>\n`
}

async function rasterize(svg, size, format = 'png') {
  // Decode at the destination resolution; do not upscale a 100px bitmap.
  const sized = svg.replace(/width="\d+(?:\.\d+)?" height="\d+(?:\.\d+)?"/, `width="${size}" height="${size}"`)
  const image = await loadImage(Buffer.from(sized))
  const canvas = createCanvas(size, size)
  canvas.getContext('2d').drawImage(image, 0, 0, size, size)
  return canvas.encode(format)
}

async function buildReview(kit, root, version, palettes) {
  const label = (x, y, text, color = '#8fa0a0', size = 14) => `<text x="${x}" y="${y}" fill="${color}" font-family="Arial,sans-serif" font-size="${size}" letter-spacing="1">${text}</text>`
  const nest = async (file, x, y, width) => {
    const svg = (await fs.readFile(path.join(kit, file), 'utf8')).replace(/<\?xml[^>]+\?>\s*/, '').replace(/\s(?:id|aria-labelledby)="[^"]+"/g, '')
    const view = svg.match(/viewBox="([^"]+)"/)[1]
    const [, , w, h] = view.split(' ').map(Number)
    return svg.replace(/<svg\b[^>]*>/, `<svg x="${x}" y="${y}" width="${width}" height="${width*h/w}" viewBox="${view}">`)
  }
  let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1120" viewBox="0 0 1400 1120"><rect width="1400" height="1120" fill="#070b0b"/>'
  svg += label(64, 56, 'THE SYNAPTIC PATH · PRODUCTION VECTOR IDENTITY', '#e4e9e9', 18)
  svg += label(64, 86, 'Modular artwork · application colors · pure monochrome · original backups')
  svg += label(64, 142, 'FOUNDATION')
  svg += await nest('lockups/horizontal-foundation-dark.svg', 48, 166, 750)
  svg += label(64, 354, 'BENTHIC CORE')
  svg += await nest('lockups/horizontal-benthic-dark.svg', 48, 378, 750)
  svg += '<line x1="900" y1="128" x2="900" y2="558" stroke="#283332"/>'
  svg += label(960, 142, 'APPLICATION / REFERENCE RED')
  svg += await nest('parts/icon.svg', 966, 176, 160)
  svg += await nest('parts/variants/icon-reference.svg', 1168, 176, 160)
  svg += label(960, 362, `${palettes.dark.icon.toUpperCase()} · DEFAULT`) + label(1160, 362, `${palettes['reference-dark'].icon.toUpperCase()} · ALTERNATE`)
  svg += label(960, 410, 'APP TILE / SMALL ICONS')
  svg += await nest('app-icon.svg', 960, 434, 128)
  for (const [index, size] of [16, 24, 32, 48].entries()) svg += await nest('parts/icon.svg', 1130+index*56, 482+(48-size)/2, size)
  svg += '<rect x="0" y="610" width="1400" height="254" fill="#f3f6f5"/>'
  svg += label(64, 652, 'LIGHT SURFACE', '#526461')
  svg += await nest('lockups/horizontal-foundation-light.svg', 48, 688, 750)
  svg += await nest('lockups/stacked-benthic-light.svg', 952, 636, 300)
  svg += '<rect x="0" y="880" width="700" height="205" fill="#ffffff"/>'
  svg += label(64, 914, 'TRUE BLACK MASTER', '#526461')
  svg += await nest('lockups/horizontal-foundation-black.svg', 32, 942, 630)
  svg += label(750, 914, 'TRUE WHITE MASTER')
  svg += await nest('lockups/horizontal-foundation-white.svg', 730, 942, 630)
  svg += label(64, 1106, `54 lockups · four independent parts · revision ${version}`, '#8fa0a0', 12) + '</svg>\n'
  await fs.mkdir(path.join(kit, 'preview'), { recursive: true })
  await fs.writeFile(path.join(kit, 'preview/review.svg'), svg)
  const image = await loadImage(Buffer.from(svg))
  const canvas = createCanvas(1400, 1120)
  canvas.getContext('2d').drawImage(image, 0, 0)
  await fs.mkdir(path.join(root, 'tmp/brand'), { recursive: true })
  await fs.writeFile(path.join(root, 'tmp/brand/synaptic-path-review.png'), await canvas.encode('png'))
}

export async function buildBrandAssets() {
  const ROOT = fileURLToPath(new URL('../', import.meta.url))
  const KIT = path.join(ROOT, 'content/brand/synaptic-path')
  const colors = tailwind.theme.extend.colors
  const palettes = makePalettes(colors)
  const parts = {}
  for (const name of PART_NAMES) parts[name] = parsePart(await fs.readFile(path.join(KIT, 'parts', `${name}.svg`), 'utf8'))
  const version = createHash('sha256').update(JSON.stringify({ parts, palettes })).digest('hex').slice(0, 12)
  await fs.writeFile(path.join(KIT, 'palettes.json'), JSON.stringify(palettes, null, 2) + '\n')
  await fs.writeFile(path.join(ROOT, 'src/components/ui/brand-geometry.json'), JSON.stringify({ version, parts }, null, 2) + '\n')
  await fs.writeFile(path.join(ROOT, 'src/components/ui/brand-assets.json'), JSON.stringify({ version }, null, 2) + '\n')

  // Canonical part colors plus one-color and reference-red exports.
  await fs.mkdir(path.join(KIT, 'parts/variants'), { recursive: true })
  for (const name of PART_NAMES) {
    const original = await fs.readFile(path.join(KIT, 'parts', `${name}.svg`), 'utf8')
    const role = name === 'icon' ? 'icon' : name === 'primary' ? 'primary' : 'secondary'
    const canonical = original.replace(/(<g\b[^>]*\bfill=")[^"]+"/, `$1${palettes.light[role]}"`)
    await fs.writeFile(path.join(KIT, 'parts', `${name}.svg`), canonical)
    for (const [tone, color] of Object.entries({ black: '#000000', white: '#ffffff', inherit: 'currentColor', ...(name === 'icon' ? { reference: '#ef174c', app: colors.crimson.aggro } : {}) })) {
      const colored = original.replace(/(<g\b[^>]*\bfill=")[^"]+"/, `$1${color}"`)
      await fs.writeFile(path.join(KIT, 'parts/variants', `${name}-${tone}.svg`), colored)
    }
  }
  // Python composes groups into standalone vectors without runtime dependencies.
  const generated = spawnSync('python3', ['-c', `import importlib.util\nfrom pathlib import Path\np=Path(${JSON.stringify(KIT)})\ns=importlib.util.spec_from_file_location('brand_compose',p/'compose.py')\nm=importlib.util.module_from_spec(s);s.loader.exec_module(m)\nfor layout in ['horizontal','stacked']:\n for subtitle in ['foundation','benthic','none']:\n  for palette in m.PALETTES:m.compose(subtitle,palette,layout)\n`], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
  if (generated.status !== 0) throw new Error(generated.stderr || 'Logo composition failed')

  const svg = iconSvg(parts.icon, colors.crimson.aggro)
  const appSvg = iconSvg(parts.icon, colors.crimson.aggro, 512, colors.benthic.bg, 76)
  await fs.writeFile(path.join(KIT, 'app-icon.svg'), appSvg)
  await fs.writeFile(path.join(ROOT, 'public/images/order_emblem.svg'), svg)
  await fs.writeFile(path.join(ROOT, 'public/favicon.svg'), svg)
  await fs.writeFile(path.join(ROOT, 'public/images/order_emblem.png'), await rasterize(svg, 512))
  await fs.writeFile(path.join(ROOT, 'public/images/order_emblem.webp'), await rasterize(svg, 512, 'webp'))
  await fs.writeFile(path.join(ROOT, 'public/favicon.png'), await rasterize(svg, 64))
  await fs.writeFile(path.join(ROOT, 'public/favicon.ico'), encodeIco(await Promise.all([16, 32, 48].map(async (size) => ({ size, png: await rasterize(svg, size) })))))
  for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['icon-maskable-512.png', 512], ['apple-touch-icon.png', 180]]) {
    await fs.writeFile(path.join(ROOT, 'public/images/pwa', file), await rasterize(appSvg, size))
  }
  // Android notification badges need an alpha silhouette, independent of app tiles.
  await fs.writeFile(path.join(ROOT, 'public/images/pwa/badge-96.png'), await rasterize(iconSvg(parts.icon, '#ffffff'), 96))
  const manifestPath = path.join(ROOT, 'public/manifest.webmanifest')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  manifest.icons = manifest.icons.map((icon) => ({ ...icon, src: `${icon.src.split('?')[0]}?v=${version}` }))
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  const swPath = path.join(ROOT, 'public/sw.js')
  const sw = await fs.readFile(swPath, 'utf8')
  await fs.writeFile(swPath, sw.replace(/const VERSION = '[^']+'/, `const VERSION = 'moltology-hub-v3-brand-${version}'`))
  await buildReview(KIT, ROOT, version, palettes)
  // Keep the downloadable kit synchronized with the production source.
  const archive = spawnSync('python3', ['-c', `from pathlib import Path\nimport zipfile\np=Path(${JSON.stringify(KIT)})\nwith zipfile.ZipFile(p.parent/'synaptic-path-logo-kit.zip','w',zipfile.ZIP_DEFLATED) as z:\n for f in sorted(p.rglob('*')):\n  if f.is_file() and '__pycache__' not in f.parts:z.write(f,f.relative_to(p.parent))\n`], { cwd: ROOT, encoding: 'utf8' })
  if (archive.status !== 0) throw new Error(archive.stderr || 'Brand kit packaging failed')
  console.log(`Brand assets generated (${version}); app red ${colors.crimson.aggro}; legacy backup retained.`)
  return { version, palettes, parts }
}

if (import.meta.url.startsWith('file:') && process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildBrandAssets().catch((error) => { console.error(error); process.exitCode = 1 })
}
