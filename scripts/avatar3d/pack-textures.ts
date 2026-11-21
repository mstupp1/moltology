/**
 * Turns Codex's raw texture images (tmp/avatar-textures/inbox/) into the small tiling textures the
 * 3D shell samples. See .agents/skills/avatar-textures/SKILL.md.
 *
 *   npm run avatar:textures -- --shell shell-detail-a.png --marking lace=marking-coral-lace-a.png
 *   npm run avatar:textures -- --publish     # upload tmp/avatar-textures/out/v<N>/ to the asset bucket
 *
 * Each image is made to tile (its edges cross-faded with a half-shifted copy), levelled, and saved as
 * a greyscale WebP at 512 px with a 256 px `-sm` copy for phones:
 * - shell-detail: height, with the large shapes removed so the tile never shows as a repeat. The
 *   shader works out the slope itself.
 * - marking-<name>: the mask, lossless so its edges stay clean.
 * - gear-<surface>: a gear material's height tile, like the shell's (`--gear metal=<file>`).
 * - gear-engraving: the engraving mask shown on rare and better gear (`--engraving <file>`).
 */
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { GEAR_SURFACES, TEXTURE_MARKINGS, TEXTURE_PREFIX, TEXTURE_VERSION, type TextureMarking } from '../../src/lib/avatar3d/textures'

const INBOX = path.resolve('tmp/avatar-textures/inbox')
/** Packed files, also read by the content renderer (scripts/lib/character-animation/render.ts). */
export const TEXTURE_OUT = path.resolve(`tmp/avatar-textures/out/v${TEXTURE_VERSION}`)
const OUT = TEXTURE_OUT
const SIZES = [
  { px: 512, suffix: '' },
  { px: 256, suffix: '-sm' },
]

type Field = { n: number; v: Float32Array }

async function readGrey(file: string, px: number): Promise<Field> {
  const full = path.isAbsolute(file) ? file : path.join(INBOX, file)
  // Images often carry an alpha channel (or come back as RGB): drop it and read one channel per
  // pixel, stepping by however many the decoder returned.
  const { data, info } = await sharp(full).flatten({ background: '#000000' }).greyscale().resize(px, px, { fit: 'cover' }).raw().toBuffer({ resolveWithObject: true })
  const v = new Float32Array(px * px)
  for (let i = 0; i < v.length; i++) v[i] = data[i * info.channels] / 255
  return { n: px, v }
}

const at = (f: Field, x: number, y: number) => f.v[(((y % f.n) + f.n) % f.n) * f.n + (((x % f.n) + f.n) % f.n)]

function stats(f: Field): { mean: number; sd: number } {
  let s = 0
  for (const x of f.v) s += x
  const mean = s / f.v.length
  let q = 0
  for (const x of f.v) q += (x - mean) ** 2
  return { mean, sd: Math.sqrt(q / f.v.length) || 1 }
}

/**
 * Make the field tile along one axis: near its edges, fade to a copy shifted by half, whose middle
 * runs on across the wrap. Mixed so the contrast stays even (two unrelated patches averaged go flat).
 */
function tileAxis(f: Field, axis: 'x' | 'y', band = 0.18): Field {
  const { n } = f
  const { mean } = stats(f)
  const out = new Float32Array(n * n)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const t = axis === 'x' ? x : y
      const edge = Math.min(t, n - 1 - t) / n
      const k = edge >= band ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * edge) / band)
      const a = at(f, x, y) - mean
      const b = (axis === 'x' ? at(f, x + n / 2, y) : at(f, x, y + n / 2)) - mean
      const wa = 1 - k
      const wb = k
      out[y * n + x] = mean + (a * wa + b * wb) / Math.sqrt(wa * wa + wb * wb)
    }
  }
  return { n, v: out }
}

const tile = (f: Field) => tileAxis(tileAxis(f, 'x'), 'y')

/** Box blur that wraps, three passes (close to a Gaussian). */
function blur(f: Field, r: number): Field {
  let cur = f
  for (let pass = 0; pass < 3; pass++) {
    for (const axis of ['x', 'y'] as const) {
      const out = new Float32Array(cur.v.length)
      for (let y = 0; y < cur.n; y++) {
        for (let x = 0; x < cur.n; x++) {
          let s = 0
          for (let d = -r; d <= r; d++) s += axis === 'x' ? at(cur, x + d, y) : at(cur, x, y + d)
          out[y * cur.n + x] = s / (2 * r + 1)
        }
      }
      cur = { n: cur.n, v: out }
    }
  }
  return cur
}

/** Spread the values so `lo`..`hi` of them land on 0..1. */
function level(f: Field, lo = 0.01, hi = 0.99): Field {
  const sorted = Float32Array.from(f.v).sort()
  const a = sorted[Math.floor(lo * (sorted.length - 1))]
  const b = sorted[Math.floor(hi * (sorted.length - 1))]
  return { n: f.n, v: f.v.map((x) => Math.min(1, Math.max(0, (x - a) / (b - a || 1)))) }
}

async function writeGrey(name: string, f: Field, lossless: boolean): Promise<number> {
  const buf = Buffer.from(f.v.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255)))
  const file = path.join(OUT, `${name}.webp`)
  await sharp(buf, { raw: { width: f.n, height: f.n, channels: 1 } })
    .toColourspace('b-w')
    .webp(lossless ? { lossless: true, effort: 6 } : { quality: 88, effort: 6 })
    .toFile(file)
  return fs.statSync(file).size
}

async function packShell(file: string): Promise<void> {
  await packHeight('shell-detail', file)
}

/** A height tile (the shell's, or a gear material's): lossy greyscale, large shapes removed. */
async function packHeight(name: string, file: string): Promise<void> {
  // Work at 1024 and shrink last, so the cross-fade stays smooth.
  let f = tile(await readGrey(file, 1024))
  // Take out the large shapes: they are what would show as a repeating pattern on the shell.
  const broad = blur(f, 24)
  f = { n: f.n, v: f.v.map((x, i) => x - broad.v[i] + 0.5) }
  f = level(f)
  for (const { px, suffix } of SIZES) {
    const bytes = await writeGrey(`${name}${suffix}`, await shrink(f, px), false)
    console.log(`${name}${suffix}.webp  ${px}px  ${(bytes / 1024).toFixed(0)} KB`)
  }
}

async function shrink(f: Field, px: number): Promise<Field> {
  if (f.n === px) return f
  const buf = Buffer.from(f.v.map((x) => Math.round(x * 255)))
  // sharp hands a one-channel image back as RGB after a resize: read one channel per pixel.
  const { data, info } = await sharp(buf, { raw: { width: f.n, height: f.n, channels: 1 } }).resize(px, px, { kernel: 'lanczos3' }).raw().toBuffer({ resolveWithObject: true })
  const v = new Float32Array(px * px)
  for (let i = 0; i < v.length; i++) v[i] = data[i * info.channels] / 255
  return { n: px, v }
}

/** The cut that best splits the values into two groups (Otsu). */
function otsu(f: Field): number {
  const bins = new Array(256).fill(0)
  for (const x of f.v) bins[Math.min(255, Math.max(0, Math.round(x * 255)))]++
  const total = f.v.length
  let sum = 0
  for (let i = 0; i < 256; i++) sum += i * bins[i]
  let below = 0
  let sumBelow = 0
  let best = 0
  let cut = 128
  for (let i = 0; i < 256; i++) {
    below += bins[i]
    if (!below || below === total) continue
    sumBelow += i * bins[i]
    const ma = sumBelow / below
    const mb = (sum - sumBelow) / (total - below)
    const between = below * (total - below) * (ma - mb) ** 2
    if (between > best) {
      best = between
      cut = i
    }
  }
  return cut / 255
}

async function packMarking(name: TextureMarking, file: string): Promise<void> {
  await packMask(`marking-${name}`, file)
}

/** A two-tone mask (a marking, or the gear engraving): lossless so its edges stay clean. */
async function packMask(name: string, file: string): Promise<void> {
  // A slight blur first, so hatching or halftone in the drawing reads as solid shapes.
  let f = blur(tile(await readGrey(file, 1024)), 1)
  f = level(f, 0.02, 0.98)
  // A clean two-tone mask: grey areas go to whichever side they are nearer. The soft edge comes
  // from the shrink to 512 px.
  const cut = otsu(f)
  f = { n: f.n, v: f.v.map((x) => (x > cut ? 1 : 0)) }
  f = blur(f, 1)
  let covered = 0
  for (const x of f.v) covered += x
  for (const { px, suffix } of SIZES) {
    const small = await shrink(f, px)
    const bytes = await writeGrey(`${name}${suffix}`, small, true)
    console.log(`${name}${suffix}.webp  ${px}px  ${(bytes / 1024).toFixed(0)} KB  ${Math.round((covered / f.v.length) * 100)}% covered`)
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  fs.mkdirSync(OUT, { recursive: true })
  let did = 0
  if (args.includes('--publish')) {
    const { uploadLocalFileToS3 } = await import('../../src/lib/ingest/s3-upload')
    for (const file of fs.readdirSync(OUT).filter((f) => f.endsWith('.webp'))) {
      const { publicUrl } = await uploadLocalFileToS3(path.join(OUT, file), `${TEXTURE_PREFIX}/${file}`)
      console.log(`${file} -> ${publicUrl}`)
    }
    return
  }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--shell') {
      await packShell(args[++i])
      did++
    } else if (args[i] === '--marking') {
      const [name, file] = (args[++i] ?? '').split('=')
      if (!(TEXTURE_MARKINGS as readonly string[]).includes(name) || !file) throw new Error(`--marking wants <${TEXTURE_MARKINGS.join('|')}>=<file>, got ${args[i]}`)
      await packMarking(name as TextureMarking, file)
      did++
    } else if (args[i] === '--gear') {
      const [name, file] = (args[++i] ?? '').split('=')
      if (!(GEAR_SURFACES as readonly string[]).includes(name) || !file) throw new Error(`--gear wants <${GEAR_SURFACES.join('|')}>=<file>, got ${args[i]}`)
      await packHeight(`gear-${name}`, file)
      did++
    } else if (args[i] === '--engraving') {
      await packMask('gear-engraving', args[++i])
      did++
    }
  }
  if (!did) {
    console.log('Usage: npm run avatar:textures -- --shell <file> --marking <name>=<file> --gear <surface>=<file> --engraving <file> ...')
    console.log(`Files are read from ${path.relative(process.cwd(), INBOX)}; markings: ${TEXTURE_MARKINGS.join(', ')}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) void main()
