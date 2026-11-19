/**
 * Painted art for the animation sets: a background plate, a cut-out middle layer and surface
 * textures for the 3D pieces, one kit per set. Prompts live in content/animation/sets/art.json so
 * any agent can make the images (Codex draws them with its own image tool; Claude asks Codex).
 * Raw images land in tmp/anim-art/<set>/raw/, `importArt` fits them to size, and the approved kit
 * is kept in the asset bucket under animation/sets/<set>/ and listed in manifest.json, so every
 * render, on any machine, uses the same art.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createCanvas, loadImage, type Image } from '@napi-rs/canvas'

export const ART_SLOTS = ['plate', 'back', 'floor', 'rug', 'wood', 'rock'] as const
export type ArtSlot = (typeof ART_SLOTS)[number]
/** Slots the 3D set uses as textures (the plate goes behind the frames instead). */
export const TEXTURE_SLOTS = ['back', 'floor', 'rug', 'wood', 'rock'] as const
export type TextureSlot = (typeof TEXTURE_SLOTS)[number]

const ROOT = process.cwd()
const SPEC_PATH = path.join(ROOT, 'content/animation/sets/art.json')
const MANIFEST_PATH = path.join(ROOT, 'content/animation/sets/manifest.json')
export const ART_DIR = path.join(ROOT, 'tmp/anim-art')
const MEDIA_ORIGIN = process.env.ANIM_ART_ORIGIN ?? 'https://moltology.org/media'

interface SlotSpec {
  size: string
  aspect: string
  note: string
  tile?: boolean
  transparent?: boolean
}
export interface ArtSpec {
  style: string
  slots: Record<ArtSlot, SlotSpec>
  sets: Record<string, Partial<Record<ArtSlot, string>>>
}
export type ArtManifest = Record<string, Partial<Record<ArtSlot, { key: string; sha: string }>>>

export function loadArtSpec(): ArtSpec {
  return JSON.parse(fs.readFileSync(SPEC_PATH, 'utf8'))
}

export function loadManifest(): ArtManifest {
  return fs.existsSync(MANIFEST_PATH) ? JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')) : {}
}

export function saveManifest(manifest: ArtManifest) {
  fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`)
}

/** The slots a set has prompts for, in a fixed order. */
export function slotsOf(spec: ArtSpec, set: string): ArtSlot[] {
  const prompts = spec.sets[set]
  if (!prompts) throw new Error(`No art prompts for set "${set}" in content/animation/sets/art.json`)
  return ART_SLOTS.filter((s) => prompts[s])
}

/** The full prompt for one image: what to draw, how this kind of image is framed, the house style. */
export function artPrompt(spec: ArtSpec, set: string, slot: ArtSlot): string {
  const what = spec.sets[set]?.[slot]
  if (!what) throw new Error(`No ${slot} prompt for set "${set}"`)
  const s = spec.slots[slot]
  const alpha = s.transparent
    ? ' Output a PNG with a transparent background. If a transparent background is not possible, put everything on a perfectly flat, solid #FF00FF magenta background with no gradient or shadow, and use no magenta anywhere in the scenery.'
    : ''
  return `${what} ${s.note} ${spec.style} Format: ${s.aspect}, ${s.size}.${alpha}`
}

export const rawPath = (set: string, slot: ArtSlot) => path.join(ART_DIR, set, 'raw', `${slot}.png`)
const extOf = (slot: ArtSlot) => (slot === 'back' ? 'png' : 'jpg')
export const finalPath = (set: string, slot: ArtSlot) => path.join(ART_DIR, set, `${slot}.${extOf(slot)}`)
export const bucketKey = (set: string, slot: ArtSlot) => `animation/sets/${set}/${slot}.${extOf(slot)}`

/** Draws an image to cover a w×h canvas, cropping the overflow from the centre. */
function cover(image: Image, w: number, h: number) {
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  const scale = Math.max(w / image.width, h / image.height)
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, (w - image.width * scale) / 2, (h - image.height * scale) / 2, image.width * scale, image.height * scale)
  return { canvas, ctx }
}

/**
 * Makes a texture repeat without a visible seam: blends the image with a copy shifted by half its
 * size (whose edges line up by construction), using the shifted copy near the edges.
 */
export function makeSeamless(data: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(data.length)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // 0 at an edge, 1 in the middle; the shifted copy is used where this is small.
      const ex = Math.min(x, w - 1 - x) / (w / 2)
      const ey = Math.min(y, h - 1 - y) / (h / 2)
      const keep = Math.min(1, Math.min(ex, ey) * 2.2)
      const sx = (x + w / 2) % w
      const sy = (y + h / 2) % h
      const i = (y * w + x) * 4
      const j = (sy * w + sx) * 4
      for (let c = 0; c < 4; c++) out[i + c] = data[i + c] * keep + data[j + c] * (1 - keep)
    }
  }
  return out
}

/** Share of pixels close to a colour. */
function shareNear(data: Uint8ClampedArray, [r, g, b]: number[], within: number): number {
  let n = 0
  for (let p = 0; p < data.length; p += 16) if (Math.hypot(data[p] - r, data[p + 1] - g, data[p + 2] - b) < within) n++
  return n / (data.length / 16)
}

/**
 * Turns a flat key colour transparent, with a soft edge: magenta when the image uses it (the
 * prompt's fallback), else a colour shared by all four corners. Images that already have
 * transparency are left alone. Returns whether anything was keyed.
 */
export function keyOut(data: Uint8ClampedArray, w: number, h: number): boolean {
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map((p) => [data[p * 4], data[p * 4 + 1], data[p * 4 + 2], data[p * 4 + 3]])
  if (corners.some((c) => c[3] < 250)) return false
  let key: number[] | null = shareNear(data, [255, 0, 255], 90) > 0.03 ? [255, 0, 255] : null
  if (!key) {
    const mean = [0, 1, 2].map((k) => corners.reduce((sum, c) => sum + c[k], 0) / 4)
    if (corners.some((c) => Math.hypot(c[0] - mean[0], c[1] - mean[1], c[2] - mean[2]) > 40)) return false
    key = mean
  }
  for (let p = 0; p < w * h; p++) {
    const d = Math.hypot(data[p * 4] - key[0], data[p * 4 + 1] - key[1], data[p * 4 + 2] - key[2])
    const a = Math.max(0, Math.min(1, (d - 70) / 60))
    data[p * 4 + 3] = Math.round(data[p * 4 + 3] * a)
    // Pull leftover magenta fringe toward neutral on the soft edge.
    if (a < 1 && key[1] === 0) data[p * 4 + 1] = Math.max(data[p * 4 + 1], Math.min(data[p * 4], data[p * 4 + 2]) * 0.6)
  }
  return true
}

/** Fits a raw image to its slot: size, seamless repeat, transparency. Returns the output path. */
export async function importArt(spec: ArtSpec, set: string, slot: ArtSlot, from = rawPath(set, slot)): Promise<string> {
  const s = spec.slots[slot]
  const [w, h] = s.size.split('x').map(Number)
  const image = await loadImage(fs.readFileSync(from))
  const { canvas, ctx } = cover(image, w, h)
  if (s.tile || s.transparent) {
    const pixels = ctx.getImageData(0, 0, w, h)
    if (s.transparent) keyOut(pixels.data, w, h)
    if (s.tile) pixels.data.set(makeSeamless(pixels.data, w, h))
    ctx.putImageData(pixels, 0, 0)
  }
  const out = finalPath(set, slot)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, extOf(slot) === 'png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', 90))
  return out
}

export const sha = (file: string) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex').slice(0, 12)

/**
 * The art for a set, as local files. A freshly imported file in tmp/anim-art/<set>/ wins (so a new
 * kit can be tried before it is uploaded); otherwise the manifest's version is fetched from the
 * bucket once and cached. Sets without art return an empty record.
 */
export async function setArtFiles(set: string | undefined): Promise<Partial<Record<ArtSlot, string>>> {
  if (!set) return {}
  const manifest = loadManifest()[set] ?? {}
  const out: Partial<Record<ArtSlot, string>> = {}
  for (const slot of ART_SLOTS) {
    const local = finalPath(set, slot)
    if (fs.existsSync(local)) {
      out[slot] = local
      continue
    }
    const entry = manifest[slot]
    if (!entry) continue
    const cached = path.join(ART_DIR, 'cache', set, `${slot}-${entry.sha}${path.extname(entry.key)}`)
    if (!fs.existsSync(cached)) {
      const response = await fetch(`${MEDIA_ORIGIN}/${entry.key}?v=${entry.sha}`)
      if (!response.ok) throw new Error(`Could not fetch set art ${entry.key}: ${response.status}`)
      fs.mkdirSync(path.dirname(cached), { recursive: true })
      fs.writeFileSync(cached, Buffer.from(await response.arrayBuffer()))
    }
    out[slot] = cached
  }
  return out
}

/** Texture files as data URLs for the browser renderer. */
export function textureUrls(files: Partial<Record<ArtSlot, string>>): Partial<Record<TextureSlot, string>> {
  const out: Partial<Record<TextureSlot, string>> = {}
  for (const slot of TEXTURE_SLOTS) {
    const file = files[slot]
    if (file) out[slot] = `data:image/${file.endsWith('.png') ? 'png' : 'jpeg'};base64,${fs.readFileSync(file).toString('base64')}`
  }
  return out
}
