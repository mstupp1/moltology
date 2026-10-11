/**
 * Avatar kit art pipeline helpers: file naming, validation, trimming, local manifests,
 * and the shot list. The CLI lives in `scripts/avatar-kit.ts`.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { AVATAR_RACES, type AvatarRace } from '../../src/lib/avatar/traits'
import {
  KIT_ACCESSORIES,
  KIT_CANVAS_PX,
  KIT_CENTER_X,
  KIT_GEAR_BRIEFS,
  KIT_RACE_LAYERS,
  type KitLayerSpec,
  type KitRacePivots,
} from '../../src/lib/avatar/kit/spec'
import type { KitAsset, KitManifest } from '../../src/lib/avatar/kit/manifest'
import { COSMETIC_CATALOG } from '../../src/lib/equipment-seed-data'
import type { ChassisVisualType } from '../../src/db/schema'

export const KIT_BUCKET_PREFIX = 'images/avatar-kit/'
export const KIT_SOURCE_PREFIX = 'avatar-kit/source/'
export const KIT_INBOX_PREFIX = 'avatar-kit/inbox/'
const IMAGE_EXT = /\.(png|webp|svg)$/i
const VECTOR_GROUPS = new Set(['eyes', 'iris', 'brows', 'lids', 'mouth'])

export type KitGroup = KitLayerSpec['id'] | 'gear' | 'look' | 'accessory'

export interface KitFileRef {
  race: AvatarRace
  /** `master` for the full reference drawing. */
  group: KitGroup | 'master'
  variant: string
  /** Base layers that share the race's grey-clay tint. */
  tinted: boolean
  mirrored: boolean
}

const GEAR_TYPES = Object.keys(KIT_GEAR_BRIEFS) as ChassisVisualType[]
const LOOK_KEYS = COSMETIC_CATALOG.map((c) => c.artKey as string)

export function layerSpec(race: AvatarRace, id: string): KitLayerSpec | undefined {
  return KIT_RACE_LAYERS[race].find((l) => l.id === id)
}

/** Allowed variants for a group, or null when the group is unknown for the race. */
export function allowedVariants(race: AvatarRace, group: string): readonly string[] | null {
  if (group === 'gear') return GEAR_TYPES
  if (group === 'look') return LOOK_KEYS
  if (group === 'accessory') return KIT_ACCESSORIES
  return layerSpec(race, group)?.variants ?? null
}

/**
 * `lobster/claw/crusher.png` → { race, group: 'claw', variant: 'crusher' }.
 * `lobster/master.png` is the full reference. Anything else is an error string.
 */
export function parseKitPath(relPath: string): KitFileRef | string {
  const clean = relPath.split(path.sep).join('/')
  if (!IMAGE_EXT.test(clean)) return `${clean}: not a .png, .webp, or .svg file`
  const parts = clean.replace(IMAGE_EXT, '').split('/')
  const race = parts[0] as AvatarRace
  if (!AVATAR_RACES.includes(race)) return `${clean}: first folder must be one of ${AVATAR_RACES.join(', ')}`
  if (parts.length === 2 && parts[1] === 'master') {
    if (/\.svg$/i.test(clean)) return `${clean}: the master must be a raster image`
    return { race, group: 'master', variant: 'master', tinted: false, mirrored: false }
  }
  if (parts.length !== 3) return `${clean}: expected <race>/<layer>/<variant> with a supported image extension`
  const [, group, variant] = parts
  if (/\.svg$/i.test(clean) && !VECTOR_GROUPS.has(group)) return `${clean}: SVG is supported only for facial layers`
  const allowed = allowedVariants(race, group)
  if (!allowed) return `${clean}: "${group}" is not a ${race} layer`
  if (!allowed.includes(variant)) return `${clean}: "${variant}" is not a known ${group} variant (${allowed.join(', ')})`
  const spec = layerSpec(race, group)
  const mirroredGear = group === 'gear' && ['pincer', 'hammer', 'antennae'].includes(variant)
  const mirroredLook = group === 'look' && ['claws', 'antennae'].includes(COSMETIC_CATALOG.find((c) => c.artKey === variant)?.category ?? '')
  return {
    race,
    group: group as KitGroup,
    variant,
    tinted: Boolean(spec?.tint),
    mirrored: Boolean(spec?.mirrored) || mirroredGear || mirroredLook,
  }
}

export async function listImageFiles(root: string): Promise<string[]> {
  const out: string[] = []
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) await walk(full)
      else if (IMAGE_EXT.test(entry.name)) out.push(path.relative(root, full))
    }
  }
  await walk(root)
  return out.sort()
}

export interface Trimmed {
  webp: Buffer
  png: Buffer
  x: number
  y: number
  w: number
  h: number
  hash: string
  svg?: Buffer
}

/** Facial vectors are self-contained shapes, never executable or externally linked SVG. */
export function validateKitSvg(source: string): void {
  const tags = new Set(['svg', 'defs', 'g', 'path', 'ellipse', 'circle', 'rect', 'linearGradient', 'radialGradient', 'stop', 'mask', 'clipPath'])
  if (!/^\s*<svg\b/.test(source) || /<!|<\?|\bon\w+\s*=|\bhref\s*=|\bstyle\s*=|<style\b/i.test(source)) throw new Error('SVG must contain only self-contained vector shapes')
  for (const tag of source.matchAll(/<\/?([\w:-]+)\b/g)) if (!tags.has(tag[1])) throw new Error(`unsupported SVG element: ${tag[1]}`)
  for (const url of source.matchAll(/url\(([^)]*)\)/g)) if (!/^#[\w-]+$/.test(url[1])) throw new Error('SVG references must point to local gradients')
}

export interface PixelStats {
  width: number
  height: number
  hasAlpha: boolean
  opaquePixels: number
  /** Mean HSV saturation of opaque pixels, 0..1. Grey clay is near 0. */
  meanSaturation: number
  bbox: { x: number; y: number; w: number; h: number } | null
}

async function rawRgba(input: Buffer | string) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height }
}

export async function pixelStats(input: Buffer | string): Promise<PixelStats> {
  const meta = await sharp(input).metadata()
  const { data, width, height } = await rawRgba(input)
  let minX = width, minY = height, maxX = -1, maxY = -1, opaque = 0, satSum = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] <= 8) continue
      opaque++
      const max = Math.max(data[i], data[i + 1], data[i + 2])
      const min = Math.min(data[i], data[i + 1], data[i + 2])
      satSum += max === 0 ? 0 : (max - min) / max
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }
  return {
    width,
    height,
    hasAlpha: Boolean(meta.hasAlpha),
    opaquePixels: opaque,
    meanSaturation: opaque ? satSum / opaque : 0,
    bbox: maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 },
  }
}

/** Crop to visible pixels (+2px), keeping the offset on the 1024 canvas. */
export async function trimKitImage(input: Buffer | string): Promise<Trimmed> {
  const stats = await pixelStats(input)
  if (!stats.bbox) throw new Error('image is fully transparent')
  const pad = 2
  const x = Math.max(0, stats.bbox.x - pad)
  const y = Math.max(0, stats.bbox.y - pad)
  const w = Math.min(stats.width - x, stats.bbox.w + pad * 2)
  const h = Math.min(stats.height - y, stats.bbox.h + pad * 2)
  const cropped = sharp(input).ensureAlpha().extract({ left: x, top: y, width: w, height: h })
  const png = await cropped.clone().png({ compressionLevel: 9 }).toBuffer()
  const webp = await cropped.clone().webp({ lossless: true, alphaQuality: 100, effort: 5 }).toBuffer()
  const meta = await sharp(input).metadata()
  let svg: Buffer | undefined
  if (meta.format === 'svg') {
    const source = (typeof input === 'string' ? await readFile(input) : input).toString('utf8')
    validateKitSvg(source)
    svg = Buffer.from(source.replace(/<svg\b[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}">`))
  }
  const hash = createHash('sha256').update(svg ?? webp).digest('hex').slice(0, 10)
  const unit = KIT_CANVAS_PX / stats.width
  return { webp, png, svg, x: x * unit, y: y * unit, w: w * unit, h: h * unit, hash }
}

export interface CheckIssue {
  file: string
  level: 'error' | 'warning'
  message: string
}

/** Share of the part's visible pixels that land on the master drawing (8px grid). */
export async function overlapWithMaster(part: Buffer | string, master: Buffer | string): Promise<number> {
  const cell = 8
  const grid = KIT_CANVAS_PX / cell
  const toGrid = async (input: Buffer | string) => {
    const { data } = await sharp(input)
      .ensureAlpha()
      .resize(grid, grid, { kernel: 'cubic', fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true })
    const mask = new Uint8Array(grid * grid)
    for (let i = 0; i < grid * grid; i++) mask[i] = data[i * 4 + 3] > 24 ? 1 : 0
    return mask
  }
  const p = await toGrid(part)
  const m = await toGrid(master)
  let inside = 0, total = 0
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if (!p[y * grid + x]) continue
      total++
      let hit = false
      for (let dy = -1; dy <= 1 && !hit; dy++) {
        for (let dx = -1; dx <= 1 && !hit; dx++) {
          const yy = y + dy, xx = x + dx
          if (yy >= 0 && yy < grid && xx >= 0 && xx < grid && m[yy * grid + xx]) hit = true
        }
      }
      if (hit) inside++
    }
  }
  return total ? inside / total : 1
}

/** Validate a delivery folder. Errors block ingest; warnings are for a human look. */
export async function checkKitFolder(root: string): Promise<{ files: { rel: string; ref: KitFileRef }[]; issues: CheckIssue[] }> {
  const issues: CheckIssue[] = []
  const files: { rel: string; ref: KitFileRef }[] = []
  const rels = await listImageFiles(root)
  if (rels.length === 0) issues.push({ file: root, level: 'error', message: 'no .png, .webp, or .svg files found' })
  const keys = new Set<string>()

  for (const rel of rels) {
    const ref = parseKitPath(rel)
    if (typeof ref === 'string') {
      issues.push({ file: rel, level: 'error', message: ref })
      continue
    }
    const full = path.join(root, rel)
    const key = `${ref.race}/${ref.group}/${ref.variant}`
    if (keys.has(key)) {
      issues.push({ file: rel, level: 'error', message: 'duplicate layer; deliver one format per part' })
      continue
    }
    keys.add(key)
    if (/\.svg$/i.test(rel)) {
      try { validateKitSvg(await readFile(full, 'utf8')) } catch (e) {
        issues.push({ file: rel, level: 'error', message: (e as Error).message })
        continue
      }
    }
    const stats = await pixelStats(full)
    if (stats.width !== stats.height || stats.width < KIT_CANVAS_PX) {
      issues.push({ file: rel, level: 'error', message: `canvas is ${stats.width}x${stats.height}; must be a square of at least ${KIT_CANVAS_PX}px, uncropped` })
      continue
    }
    if (!stats.hasAlpha || !stats.bbox) {
      issues.push({ file: rel, level: 'error', message: 'needs a transparent background with something drawn on it' })
      continue
    }
    const coverage = stats.opaquePixels / (stats.width * stats.height)
    if (ref.group !== 'master' && coverage > 0.6) {
      issues.push({ file: rel, level: 'error', message: `covers ${Math.round(coverage * 100)}% of the canvas; the background was probably not removed` })
    }
    files.push({ rel, ref })
  }

  return { files, issues }
}

export async function fileExists(p: string): Promise<boolean> {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

export async function readJson<T>(p: string): Promise<T> {
  return JSON.parse(await readFile(p, 'utf8')) as T
}

// ─── Pixel tools: alignment, recolour prep, gear extraction ─────────────────
// Image models redraw the whole frame on every edit, so a part never lands on the exact
// pixels of the master. These tools put each delivery back on the master before trimming.

export interface Rgba {
  data: Buffer
  w: number
  h: number
}

export async function loadRgba(input: Buffer | string, size = KIT_CANVAS_PX): Promise<Rgba> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .resize(size, size, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true })
  return { data, w: info.width, h: info.height }
}

export async function rgbaToPng(img: Rgba): Promise<Buffer> {
  return sharp(img.data, { raw: { width: img.w, height: img.h, channels: 4 } }).png().toBuffer()
}

const luma = (d: Buffer, i: number) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]

/** Scale about the canvas centre, then shift. Pixels pushed off the canvas are dropped. */
export async function transformRgba(img: Rgba, dx: number, dy: number, scale: number): Promise<Rgba> {
  const size = Math.max(1, Math.round(img.w * scale))
  const scaled = scale === 1 ? img : await loadRgba(await rgbaToPng(img), size)
  const out = Buffer.alloc(img.w * img.h * 4)
  const ox = Math.round((img.w - size) / 2 + dx)
  const oy = Math.round((img.h - size) / 2 + dy)
  for (let y = 0; y < size; y++) {
    const ty = y + oy
    if (ty < 0 || ty >= img.h) continue
    for (let x = 0; x < size; x++) {
      const tx = x + ox
      if (tx < 0 || tx >= img.w) continue
      scaled.data.copy(out, (ty * img.w + tx) * 4, (y * size + x) * 4, (y * size + x) * 4 + 4)
    }
  }
  return { data: out, w: img.w, h: img.h }
}

export interface Fit {
  dx: number
  dy: number
  scale: number
  /** Mean luminance difference on the part's pixels (0 = perfect). */
  score: number
}

function scoreShift(part: Rgba, master: Rgba, samples: number[], dx: number, dy: number): number {
  let sum = 0
  for (const idx of samples) {
    const x = idx % part.w + dx
    const y = Math.floor(idx / part.w) + dy
    if (x < 0 || y < 0 || x >= master.w || y >= master.h) {
      sum += 255
      continue
    }
    const mi = (y * master.w + x) * 4
    sum += master.data[mi + 3] < 64 ? 255 : Math.abs(luma(part.data, idx * 4) - luma(master.data, mi))
  }
  return sum / samples.length
}

function opaqueSamples(img: Rgba, step: number): number[] {
  const out: number[] = []
  for (let i = 0; i < img.w * img.h; i += step) if (img.data[i * 4 + 3] > 128) out.push(i)
  return out
}

/**
 * Find the shift and scale that put a part (or an edited copy of the master) back on the
 * master. Coarse search at quarter size, then a ±4 px refine at full size.
 */
export async function registerToMaster(part: Buffer | string, master: Buffer | string): Promise<Fit & { identity: number }> {
  const q = KIT_CANVAS_PX / 4
  const masterQ = await loadRgba(master, q)
  const partQ = await loadRgba(part, q)
  let best: Fit = { dx: 0, dy: 0, scale: 1, score: Infinity }
  for (const scale of [0.94, 0.97, 1, 1.03, 1.06]) {
    const scaled = await transformRgba(partQ, 0, 0, scale)
    const samples = opaqueSamples(scaled, 2)
    if (samples.length < 20) continue
    for (let dy = -24; dy <= 24; dy++) {
      for (let dx = -24; dx <= 24; dx++) {
        const score = scoreShift(scaled, masterQ, samples, dx, dy)
        if (score < best.score) best = { dx: dx * 4, dy: dy * 4, scale, score }
      }
    }
  }
  if (!Number.isFinite(best.score)) return { dx: 0, dy: 0, scale: 1, score: Infinity, identity: Infinity }

  const masterF = await loadRgba(master)
  const partF = await loadRgba(part)
  const identity = scoreShift(partF, masterF, opaqueSamples(partF, 7), 0, 0)
  const scaledF = await transformRgba(partF, 0, 0, best.scale)
  const samples = opaqueSamples(scaledF, 7)
  let refined = best
  for (let dy = best.dy - 4; dy <= best.dy + 4; dy++) {
    for (let dx = best.dx - 4; dx <= best.dx + 4; dx++) {
      const score = scoreShift(scaledF, masterF, samples, dx, dy)
      if (score < refined.score || (dx === best.dx && dy === best.dy && refined === best)) {
        refined = { dx, dy, scale: best.scale, score }
      }
    }
  }
  return { ...refined, identity }
}

/**
 * Grey "clay" for recoloured layers: luminance only, levelled so the part's typical tone
 * lands on the palette's base colour. Lets artists paint in the master's real colours.
 */
export function toClay(img: Rgba): Rgba {
  const lums: number[] = []
  for (let i = 0; i < img.w * img.h; i++) if (img.data[i * 4 + 3] > 32) lums.push(luma(img.data, i * 4))
  if (lums.length === 0) return img
  lums.sort((a, b) => a - b)
  const pct = (p: number) => lums[Math.min(lums.length - 1, Math.floor(p * lums.length))]
  const lo = pct(0.02), mid = pct(0.5), hi = pct(0.98)
  const out = Buffer.from(img.data)
  for (let i = 0; i < img.w * img.h; i++) {
    const o = i * 4
    if (out[o + 3] === 0) continue
    const l = luma(img.data, o)
    const t = l <= mid
      ? 0.06 + ((l - lo) / Math.max(1, mid - lo)) * (0.6 - 0.06)
      : 0.6 + ((l - mid) / Math.max(1, hi - mid)) * 0.4
    const v = Math.round(Math.min(1, Math.max(0, t)) * 255)
    out[o] = out[o + 1] = out[o + 2] = v
  }
  return { data: out, w: img.w, h: img.h }
}

/** Split coloured irises out of an eyes drawing so the app can recolour them. */
export function splitIris(img: Rgba): { eyes: Rgba; iris: Rgba; irisShare: number } {
  const eyes = Buffer.from(img.data)
  const iris = Buffer.alloc(img.data.length)
  let opaque = 0, moved = 0
  for (let i = 0; i < img.w * img.h; i++) {
    const o = i * 4
    if (img.data[o + 3] <= 32) continue
    opaque++
    const max = Math.max(img.data[o], img.data[o + 1], img.data[o + 2])
    const min = Math.min(img.data[o], img.data[o + 1], img.data[o + 2])
    const sat = max === 0 ? 0 : (max - min) / max
    if (sat > 0.35 && max > 40 && max < 250) {
      img.data.copy(iris, o, o, o + 4)
      eyes[o + 3] = 0
      moved++
    }
  }
  return { eyes: { data: eyes, w: img.w, h: img.h }, iris: { data: iris, w: img.w, h: img.h }, irisShare: opaque ? moved / opaque : 0 }
}

/**
 * Pull the new item out of "the master wearing X": align the edit to the master, keep the
 * pixels that changed, and clean up specks. Returns a full-canvas layer.
 */
export async function extractAddition(master: Buffer | string, edited: Buffer | string): Promise<{ layer: Rgba; fit: Fit }> {
  const fit = await registerToMaster(edited, master)
  const size = (await sharp(edited).metadata()).width ?? KIT_CANVAS_PX
  const unit = size / KIT_CANVAS_PX
  const e = await transformRgba(await loadRgba(edited, size), fit.dx * unit, fit.dy * unit, fit.scale)
  const m = await loadRgba(master, size)
  const n = e.w * e.h
  const mask = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (e.data[o + 3] < 32) continue
    if (m.data[o + 3] < 32) {
      mask[i] = 1
      continue
    }
    const dist = Math.abs(e.data[o] - m.data[o]) + Math.abs(e.data[o + 1] - m.data[o + 1]) + Math.abs(e.data[o + 2] - m.data[o + 2])
    mask[i] = dist > 90 ? 1 : 0
  }
  // Box blur (r=3) then threshold: drops redraw noise, keeps solid regions.
  const r = 3
  const smooth = new Float32Array(n)
  for (let y = 0; y < e.h; y++) {
    for (let x = 0; x < e.w; x++) {
      let s = 0, c = 0
      for (let yy = Math.max(0, y - r); yy <= Math.min(e.h - 1, y + r); yy++) {
        for (let xx = Math.max(0, x - r); xx <= Math.min(e.w - 1, x + r); xx++) {
          s += mask[yy * e.w + xx]
          c++
        }
      }
      smooth[y * e.w + x] = s / c
    }
  }
  const out = Buffer.alloc(e.data.length)
  for (let i = 0; i < n; i++) {
    if (smooth[i] < 0.5) continue
    const o = i * 4
    e.data.copy(out, o, o, o + 4)
  }
  return { layer: { data: out, w: e.w, h: e.h }, fit }
}

// ─── Prepare: what check and ingest actually trim ──────────────────────────

export interface PreparedPart {
  /** Manifest key, `<race>/<group>/<variant>`. */
  key: string
  ref: KitFileRef
  /** Full native-resolution canvas, aligned and recoloured, ready to trim. */
  png: Buffer
  /** Original facial vector, preserved for resolution-independent display. */
  svg?: Buffer
  /** Delivered file this came from (iris split from eyes shares the eyes file). */
  rel: string
  notes: string[]
}

const OVERLAY_GROUPS = new Set(['gear', 'look', 'accessory'])
/** Largest shift (canvas px) the aligner may apply before we call it a mismatch. */
const MAX_SHIFT = 96

/** A gear or look file that still contains the whole character is cut out automatically. */
async function isFullFigure(part: Buffer, master: Buffer): Promise<boolean> {
  const count = async (input: Buffer) => (await pixelStats(await rgbaToPng(await loadRgba(input)))).opaquePixels
  const [p, m] = await Promise.all([count(part), count(master)])
  return m > 0 && p >= m * 0.6
}

const fitLabel = (f: Fit) => `moved ${f.dx},${f.dy}px${f.scale === 1 ? '' : `, scaled ${f.scale}`}`

/**
 * Turn a checked delivery into parts the renderer can use:
 * - base layers are snapped onto the master (image models never redraw in the exact spot);
 *   iris and lids follow their eyes;
 * - recoloured layers become grey clay, so art can be painted in the master's real colours;
 * - irises are split out of eyes when no iris file was delivered;
 * - gear, looks, and accessories delivered as "the master wearing X" are cut out.
 * Without a master for a race, files are used as delivered.
 */
export async function prepareKitParts(
  root: string,
  files: { rel: string; ref: KitFileRef }[],
  masters: Partial<Record<AvatarRace, Buffer>>
): Promise<{ parts: PreparedPart[]; issues: CheckIssue[] }> {
  const parts: PreparedPart[] = []
  const issues: CheckIssue[] = []
  const eyeFits = new Map<string, Fit>()
  const delivered = new Set(files.map((f) => `${f.ref.race}/${f.ref.group}/${f.ref.variant}`))
  const order = (f: { ref: KitFileRef }) => (f.ref.group === 'eyes' ? 0 : f.ref.group === 'iris' || f.ref.group === 'lids' ? 2 : 1)
  const queue = [...files].filter((f) => f.ref.group !== 'master').sort((a, b) => order(a) - order(b))

  for (const { rel, ref } of queue) {
    const key = `${ref.race}/${ref.group}/${ref.variant}`
    const notes: string[] = []
    const raw = await readFile(path.join(root, rel))
    const master = masters[ref.race]
    const size = (await sharp(raw).metadata()).width ?? KIT_CANVAS_PX
    const unit = size / KIT_CANVAS_PX
    const vector = /\.svg$/i.test(rel)
    let img = await loadRgba(raw, size)

    if (vector && ref.group === 'eyes' && !delivered.has(`${ref.race}/iris/${ref.variant}`)) {
      issues.push({ file: rel, level: 'error', message: 'vector eyes need a matching iris layer for eye colour changes' })
      continue
    }

    if (vector && ref.tinted && (await pixelStats(raw)).meanSaturation > 0.02) {
      issues.push({ file: rel, level: 'error', message: 'recoloured vector layers must be painted in neutral grey tones' })
      continue
    }

    if (OVERLAY_GROUPS.has(ref.group)) {
      if (master && (await isFullFigure(raw, master))) {
        const { layer, fit } = await extractAddition(master, raw)
        img = layer
        notes.push(`cut out of a full drawing (${fitLabel(fit)})`)
      }
    } else if (master && !vector) {
      let fit: Fit | undefined
      if (ref.group === 'iris' || ref.group === 'lids') {
        const spec = layerSpec(ref.race, 'eyes')
        fit = eyeFits.get(`${ref.race}/${ref.variant}`) ?? eyeFits.get(`${ref.race}/${spec?.defaultVariant}`)
      } else {
        const found = await registerToMaster(raw, master)
        const moved = Math.abs(found.dx) <= MAX_SHIFT && Math.abs(found.dy) <= MAX_SHIFT
        // Only move a part that is clearly off: parts hidden under other layers in the master
        // (the body under the belly) score poorly in place and attract false matches.
        if (moved && found.score < found.identity * 0.6) fit = found
        else if (!moved) issues.push({ file: rel, level: 'warning', message: 'could not find where it sits on the master; used as delivered' })
      }
      if (fit && (fit.dx || fit.dy || fit.scale !== 1)) {
        img = await transformRgba(img, fit.dx * unit, fit.dy * unit, fit.scale)
        notes.push(`aligned to master (${fitLabel(fit)})`)
      }
      if (ref.group === 'eyes') eyeFits.set(`${ref.race}/${ref.variant}`, fit ?? { dx: 0, dy: 0, scale: 1, score: 0 })
    }

    if (ref.group === 'eyes' && !delivered.has(`${ref.race}/iris/${ref.variant}`)) {
      const split = splitIris(img)
      if (split.irisShare > 0.02) {
        img = split.eyes
        const irisRef: KitFileRef = { ...ref, group: 'iris', tinted: true }
        parts.push({ key: `${ref.race}/iris/${ref.variant}`, ref: irisRef, rel, png: await rgbaToPng(toClay(split.iris)), notes: ['split out of the eyes, grey clay'] })
        notes.push('irises split out')
      }
    }
    if (ref.tinted && !vector) {
      img = toClay(img)
      notes.push('grey clay')
    }
    const png = await rgbaToPng(img)
    const bbox = (await pixelStats(png)).bbox
    if (!bbox) {
      issues.push({ file: rel, level: 'error', message: 'nothing left after preparing it (was the edit identical to the master?)' })
      continue
    }
    if (ref.mirrored && (bbox.x + bbox.w / 2) / unit > KIT_CENTER_X) {
      issues.push({ file: rel, level: 'warning', message: 'should sit on the screen-left half (the app mirrors it for the right side)' })
    }
    if (vector) notes.push('vector geometry preserved')
    parts.push({ key, ref, rel, png, svg: vector ? raw : undefined, notes })
  }

  // Default base parts should land on the master once aligned.
  for (const part of parts) {
    const master = masters[part.ref.race]
    if (!master || OVERLAY_GROUPS.has(part.ref.group) || ['iris', 'lids'].includes(part.ref.group)) continue
    if (part.ref.variant !== layerSpec(part.ref.race, part.ref.group)?.defaultVariant) continue
    const share = await overlapWithMaster(part.png, master)
    if (share < 0.8) issues.push({ file: part.rel, level: 'warning', message: `only ${Math.round(share * 100)}% of it lands on the master; check alignment` })
  }
  return { parts, issues }
}

/** Optional `<race>/pivots.json`: { "antenna": [x, y], "shoulder": [x, y], "tail": [x, y] } in canvas px. */
export async function readKitPivots(root: string): Promise<{ races: KitManifest['races']; issues: CheckIssue[] }> {
  const races: KitManifest['races'] = {}
  const issues: CheckIssue[] = []
  for (const race of AVATAR_RACES) {
    const file = path.join(root, race, 'pivots.json')
    if (!(await fileExists(file))) continue
    const rel = `${race}/pivots.json`
    let data: unknown
    try {
      data = await readJson(file)
    } catch {
      issues.push({ file: rel, level: 'error', message: 'is not valid JSON' })
      continue
    }
    const pivots: Partial<Record<keyof KitRacePivots, [number, number]>> = {}
    for (const [name, value] of Object.entries(data as Record<string, unknown>)) {
      const ok = ['antenna', 'shoulder', 'tail'].includes(name) && Array.isArray(value) && value.length === 2 &&
        value.every((n) => typeof n === 'number' && n >= 0 && n <= KIT_CANVAS_PX)
      if (!ok) {
        issues.push({ file: rel, level: 'error', message: `"${name}" must be antenna, shoulder, or tail with [x, y] inside the canvas` })
        continue
      }
      pivots[name as keyof KitRacePivots] = [Math.round(value[0]), Math.round(value[1])]
    }
    if (Object.keys(pivots).length) races[race] = { pivots }
  }
  return { races, issues }
}

/** Manifest built from prepared parts, with images inlined as PNG data URIs (for previews). */
export async function localKitManifest(parts: PreparedPart[], races: KitManifest['races'] = {}) {
  const manifest: KitManifest = { version: 1, races, assets: {} }
  const dataUris = new Map<string, string>()
  for (const part of parts) {
    const t = await trimKitImage(part.svg ?? part.png)
    manifest.assets[part.key] = { src: part.key, x: t.x, y: t.y, w: t.w, h: t.h } satisfies KitAsset
    dataUris.set(part.key, `data:${t.svg ? 'image/svg+xml' : 'image/png'};base64,${(t.svg ?? t.png).toString('base64')}`)
  }
  return { manifest, href: (asset: KitAsset) => dataUris.get(asset.src) ?? '' }
}
