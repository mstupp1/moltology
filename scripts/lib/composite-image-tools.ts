import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage, type Image } from '@napi-rs/canvas'

/**
 * Small image helpers for the composite pipeline: render QA, native-size exports, reference
 * palettes and side-by-side comparisons. Built on @napi-rs/canvas so no new native deps.
 */

export async function readImage(filePath: string): Promise<Image> {
  return loadImage(fs.readFileSync(filePath))
}

export interface FrameStats {
  width: number
  height: number
  /** Mean luminance 0-255. */
  mean: number
  /** Luminance standard deviation; near zero means a flat, probably blank frame. */
  stddev: number
}

export async function frameStats(filePath: string): Promise<FrameStats> {
  const img = await readImage(filePath)
  const sw = 96
  const sh = Math.max(1, Math.round((img.height / img.width) * sw))
  const canvas = createCanvas(sw, sh)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, sw, sh)
  const { data } = ctx.getImageData(0, 0, sw, sh)
  const lum: number[] = []
  for (let i = 0; i < data.length; i += 4) lum.push(0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2])
  const mean = lum.reduce((a, b) => a + b, 0) / lum.length
  const stddev = Math.sqrt(lum.reduce((a, b) => a + (b - mean) ** 2, 0) / lum.length)

  return { width: img.width, height: img.height, mean, stddev }
}

/** High-quality downscale (e.g. a 2x master to the platform's native size). */
export async function resizeImage(inputPath: string, outputPath: string, width: number, height: number): Promise<void> {
  const img = await readImage(inputPath)
  let current: Image | ReturnType<typeof createCanvas> = img
  let cw = img.width
  let ch = img.height
  // Halve in steps so large reductions stay sharp instead of aliasing.
  while (cw / 2 >= width && ch / 2 >= height) {
    const step = createCanvas(Math.round(cw / 2), Math.round(ch / 2))
    const sctx = step.getContext('2d')
    sctx.imageSmoothingEnabled = true
    sctx.imageSmoothingQuality = 'high'
    sctx.drawImage(current as any, 0, 0, step.width, step.height)
    current = step
    cw = step.width
    ch = step.height
  }
  const out = createCanvas(width, height)
  const ctx = out.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(current as any, 0, 0, width, height)
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, await encodeFor(outputPath, out))
}

async function encodeFor(outputPath: string, canvas: ReturnType<typeof createCanvas>, quality = 90): Promise<Buffer> {
  const ext = path.extname(outputPath).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return canvas.encode('jpeg', quality)
  if (ext === '.webp') return canvas.encode('webp', quality)
  return canvas.encode('png')
}

export interface PaletteSwatch {
  hex: string
  share: number
}

/**
 * Dominant colors via coarse 4-bit-per-channel buckets on a thumbnail, merged when close.
 * Good enough to brief a recreation ("navy field, hot coral accent"), not a color science tool.
 */
export async function extractPalette(filePath: string, count = 6): Promise<PaletteSwatch[]> {
  const img = await readImage(filePath)
  const sw = 80
  const sh = Math.max(1, Math.round((img.height / img.width) * sw))
  const canvas = createCanvas(sw, sh)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, sw, sh)
  const { data } = ctx.getImageData(0, 0, sw, sh)

  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  let total = 0
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
    const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 }
    bucket.r += data[i]
    bucket.g += data[i + 1]
    bucket.b += data[i + 2]
    bucket.n++
    buckets.set(key, bucket)
    total++
  }

  const merged: { r: number; g: number; b: number; n: number }[] = []
  for (const b of [...buckets.values()].sort((x, y) => y.n - x.n)) {
    const c = { r: b.r / b.n, g: b.g / b.n, b: b.b / b.n, n: b.n }
    const near = merged.find((m) => Math.hypot(m.r - c.r, m.g - c.g, m.b - c.b) < 42)
    if (near) {
      const n = near.n + c.n
      near.r = (near.r * near.n + c.r * c.n) / n
      near.g = (near.g * near.n + c.g * c.n) / n
      near.b = (near.b * near.n + c.b * c.n) / n
      near.n = n
    } else {
      merged.push(c)
    }
  }

  return merged
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((c) => ({ hex: toHex(c.r, c.g, c.b), share: Math.round((c.n / Math.max(1, total)) * 1000) / 1000 }))
}

function toHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Side-by-side board: each image scaled to the same height with a caption strip, for judging
 * a recreation against its reference (or before/after renders) at a glance.
 */
export async function composeComparison(
  items: { path: string; label: string }[],
  outputPath: string,
  height = 1200
): Promise<void> {
  const images = await Promise.all(items.map((item) => readImage(item.path)))
  const gap = 32
  const caption = 64
  const widths = images.map((img) => Math.round((img.width / img.height) * height))
  const canvas = createCanvas(widths.reduce((a, b) => a + b, 0) + gap * (images.length + 1), height + caption + gap * 2)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0b0f12'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  let x = gap
  images.forEach((img, i) => {
    ctx.drawImage(img, x, gap, widths[i], height)
    ctx.fillStyle = '#e5e7eb'
    ctx.font = '600 30px sans-serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(items[i].label, x, gap + height + caption / 2 + 6)
    x += widths[i] + gap
  })

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, await encodeFor(outputPath, canvas, 88))
}

export const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'])

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
}

export function fileToDataUri(filePath: string): string {
  const mime = MIME[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream'
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`
}

/**
 * Replace local image paths anywhere in a payload with data URIs, so a spec can use a plate
 * from tmp/ or the reference library without uploading it. Only explicit filesystem paths
 * (absolute, ./, ../, ~/ or tmp/) that exist are inlined; S3-relative paths are left alone.
 */
export function inlineLocalImages<T>(value: T, cwd = process.cwd()): T {
  if (typeof value === 'string') {
    const looksLocal = /^(\/|\.\.?\/|~\/|tmp\/)/.test(value)
    const ext = path.extname(value.split('?')[0]).toLowerCase()
    if (looksLocal && (IMAGE_EXTENSIONS.has(ext) || ext === '.svg')) {
      const resolved = value.startsWith('~/')
        ? path.join(process.env.HOME || '', value.slice(2))
        : path.resolve(cwd, value)
      if (fs.existsSync(resolved)) return fileToDataUri(resolved) as T
    }
    return value
  }
  if (Array.isArray(value)) return value.map((v) => inlineLocalImages(v, cwd)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, inlineLocalImages(v, cwd)])) as T
  }
  return value
}
