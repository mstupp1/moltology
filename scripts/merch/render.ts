import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import type { MerchDesign, MerchLayerSource } from './designs'

const MEDIA_ORIGIN = 'https://moltology.org/media'

async function loadSource(source: MerchLayerSource, cacheDir: string): Promise<Buffer> {
  if ('repo' in source) return fs.readFileSync(path.resolve(source.repo))
  const cached = path.join(cacheDir, source.media.replace(/\//g, '__'))
  if (fs.existsSync(cached)) return fs.readFileSync(cached)
  const response = await fetch(`${MEDIA_ORIGIN}/${source.media}`)
  if (!response.ok) throw new Error(`Could not fetch ${source.media} (${response.status}).`)
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.mkdirSync(cacheDir, { recursive: true })
  fs.writeFileSync(cached, buffer)
  return buffer
}

/** Rasterizes one layer to fit its box. SVGs render at a density high enough to stay sharp. */
async function renderLayer(input: Buffer, isSvg: boolean, boxWidth: number, boxHeight: number): Promise<Buffer> {
  const base = sharp(input, isSvg ? { density: 1200 } : {})
  return base
    .resize({ width: Math.round(boxWidth), height: Math.round(boxHeight), fit: 'inside', withoutEnlargement: false })
    .png()
    .toBuffer()
}

/** Renders a print file PNG (300 dpi) for a design. */
export async function renderPrintFile(design: MerchDesign, outPath: string, cacheDir: string): Promise<string> {
  const composites: sharp.OverlayOptions[] = []
  for (const layer of design.layers) {
    const source = await loadSource(layer.source, cacheDir)
    const isSvg = 'repo' in layer.source && layer.source.repo.endsWith('.svg')
    const rendered = await renderLayer(source, isSvg, layer.maxWidth * design.width, layer.maxHeight * design.height)
    const meta = await sharp(rendered).metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    composites.push({
      input: rendered,
      left: Math.round(layer.cx * design.width - width / 2),
      top: Math.round(layer.cy * design.height - height / 2),
    })
  }
  const background = design.background
    ? sharp({ create: { width: design.width, height: design.height, channels: 4, background: design.background } })
    : sharp({ create: { width: design.width, height: design.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  await background.composite(composites).png({ compressionLevel: 9 }).withMetadata({ density: 300 }).toFile(outPath)
  return outPath
}

/** A small preview of a print file on its blank color, used as the mockup reference. */
export async function renderReference(
  printFile: string,
  blankColor: string,
  outPath: string,
  half?: 'left' | 'right',
): Promise<string> {
  const meta = await sharp(printFile).metadata()
  const fullWidth = meta.width ?? 1
  const fullHeight = meta.height ?? 1
  const cropWidth = half ? Math.floor(fullWidth / 2) : fullWidth
  const source = sharp(printFile).extract({ left: half === 'right' ? fullWidth - cropWidth : 0, top: 0, width: cropWidth, height: fullHeight })
  const width = 1600
  const height = Math.round((fullHeight / cropWidth) * width)
  const art = await source.resize({ width }).png().toBuffer()
  await sharp({ create: { width, height, channels: 3, background: blankColor } })
    .composite([{ input: art }])
    .jpeg({ quality: 90 })
    .toFile(outPath)
  return outPath
}
