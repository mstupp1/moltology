/**
 * Stills of the content cast (content/characters/cast.json), drawn with the site's own 3D
 * character code: transparent full-figure cutouts, head-and-shoulders portraits and reference
 * sheets (front, three-quarter, side, back and a portrait on one image) for image models.
 */
import fs from 'node:fs'
import path from 'node:path'
import { createCanvas, loadImage, type Image } from '@napi-rs/canvas'
import { CAST, castMember, lookHash, type CastMember } from '../../src/lib/cast'
import { resolveMascotAlias } from '../../src/lib/mascots'
import { parseLobsterAvatarConfig } from '../../src/lib/lobster-avatar'
import { lookFromConfig } from '../../src/lib/avatar3d/look'
import { SHOTS, type AnimationTimeline } from '../../src/lib/avatar3d/scripted'
import type { AvatarPose } from '../../src/lib/avatar/traits'
import { renderStills, type StillJob } from './character-animation/render'

export const CAST_STILL_DIR = path.resolve(process.cwd(), 'tmp/cast')

export const STILL_SHOTS = ['full', 'portrait', 'sheet'] as const
export type StillShot = (typeof STILL_SHOTS)[number]

/** Face settings for an expression, applied over the character's own. */
export const MOODS = {
  happy: { eyelidStyle: 'cheerful_squint', mouth: 'beam' },
  calm: { eyelidStyle: 'relaxed', mouth: 'smile' },
  focused: { eyelidStyle: 'focused', mouth: 'smile' },
  smug: { eyelidStyle: 'smug', mouth: 'smirk' },
  worried: { eyelidStyle: 'worried', mouth: 'wobble' },
  sad: { eyelidStyle: 'sad', mouth: 'frown' },
  shocked: { eyelidStyle: 'shocked', mouth: 'oh' },
  angry: { eyelidStyle: 'angry', mouth: 'frown' },
  wink: { eyelidStyle: 'wink', mouth: 'grin' },
} as const
export type Mood = keyof typeof MOODS

export interface StillRequest {
  member: CastMember
  shot: StillShot
  pose?: AvatarPose
  mood?: Mood
  /** Turn in radians; 0 faces the viewer. Default: a slight three-quarter turn. */
  yaw?: number
  /** Where the eyes look. */
  gaze?: 'ahead' | 'left' | 'right' | 'up' | 'down'
  /** Pixel size multiplier (1 = 1200x1200 full before cropping, 800x800 portrait). */
  scale?: number
}

/** A cast key, alias or name ("juno", "host-crab", "Juno Marsh") to its cast member. */
export function findCastMember(raw: string): CastMember {
  const member = castMember(resolveMascotAlias(raw))
  if (!member) throw new Error(`No cast member "${raw}" (have: ${CAST.map((m) => m.key).join(', ')})`)
  return member
}

function lookFor(member: CastMember, pose: AvatarPose, mood?: Mood, gaze?: string) {
  const config = parseLobsterAvatarConfig({
    style: 'critters',
    ...member.config,
    pose,
    ...(mood ? MOODS[mood] : {}),
    ...(gaze ? { gaze } : {}),
  })
  if (!config) throw new Error(`Cast member "${member.key}" has an invalid character config`)
  return lookFromConfig(config)
}

function stillTimeline(member: CastMember, view: 'wide' | 'close', size: [number, number], pose: AvatarPose, yaw: number, mood?: Mood, gaze?: string): AnimationTimeline {
  return {
    width: Math.round(size[0]),
    height: Math.round(size[1]),
    fps: 30,
    // A short settle so the pose and idle motion are at rest, not mid-blend.
    frames: 18,
    look: lookFor(member, pose, mood, gaze),
    // Eyes to the camera unless a gaze was asked for.
    cues: [{ t: 0, camera: { ...SHOTS[view], ...(view === 'wide' ? { zoom: 0.8 } : {}), pan: 0, cut: true }, yaw, ...(gaze ? {} : { look: { x: 0, y: 0 } }) }],
    talk: [],
    lighting: 'studio',
  }
}

const SHEET_VIEWS: { label: string; yaw: number }[] = [
  { label: 'Front', yaw: 0 },
  { label: 'Three-quarter', yaw: 0.65 },
  { label: 'Side', yaw: 1.5 },
  { label: 'Back', yaw: Math.PI },
]

/** Where a still is kept; the name carries everything that changes the picture, so it doubles as a cache. */
export function stillPath(req: StillRequest): string {
  const pose = req.pose ?? req.member.pose
  const parts = [req.shot, pose, req.mood ?? 'own', req.gaze ?? 'ahead']
  if (req.yaw !== undefined && req.shot !== 'sheet') parts.push(`y${req.yaw.toFixed(2)}`)
  if (req.scale && req.scale !== 1) parts.push(`s${req.scale}`)
  parts.push(lookHash(req.member))
  return path.join(CAST_STILL_DIR, req.member.key, `${parts.join('-')}.png`)
}

/** Bounds of the visible pixels. */
function alphaBounds(img: Image): { x: number; y: number; w: number; h: number } {
  const c = createCanvas(img.width, img.height)
  const g = c.getContext('2d')
  g.drawImage(img, 0, 0)
  const { data } = g.getImageData(0, 0, img.width, img.height)
  let x0 = img.width, y0 = img.height, x1 = -1, y1 = -1
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (data[(y * img.width + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  if (x1 < 0) return { x: 0, y: 0, w: img.width, h: img.height }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }
}

/** Crops a transparent PNG to its visible pixels plus a margin, in place. */
export async function trimTransparent(file: string, margin = 24): Promise<void> {
  const img = await loadImage(file)
  const b = alphaBounds(img)
  const c = createCanvas(b.w + margin * 2, b.h + margin * 2)
  c.getContext('2d').drawImage(img, b.x, b.y, b.w, b.h, margin, margin, b.w, b.h)
  fs.writeFileSync(file, c.toBuffer('image/png'))
}

/** WebP twin of a PNG (quality 90), next to it. */
export async function toWebp(file: string): Promise<string> {
  const img = await loadImage(file)
  const c = createCanvas(img.width, img.height)
  c.getContext('2d').drawImage(img, 0, 0)
  const out = file.replace(/\.png$/, '.webp')
  fs.writeFileSync(out, await c.encode('webp', 90))
  return out
}

async function composeSheet(member: CastMember, views: string[], portrait: string, out: string): Promise<void> {
  const tiles = await Promise.all(views.map((v) => loadImage(v)))
  const face = await loadImage(portrait)
  const tileW = tiles[0].width, tileH = tiles[0].height
  const pad = 32, head = 96, label = 56
  const faceW = Math.round((face.width / face.height) * tileH)
  const W = pad + (tileW + pad) * tiles.length + faceW + pad
  const H = head + tileH + label + pad
  const c = createCanvas(W, H)
  const g = c.getContext('2d')
  g.fillStyle = '#dfe4ec'
  g.fillRect(0, 0, W, H)
  g.fillStyle = '#0b1424'
  g.font = '600 48px sans-serif'
  g.fillText(`${member.name}: 3D character reference`, pad, 66)
  g.font = '30px sans-serif'
  g.fillStyle = '#3b4a60'
  const labels = [...SHEET_VIEWS.map((v) => v.label), 'Face']
  ;[...tiles, face].forEach((img, i) => {
    const x = pad + (tileW + pad) * i
    const w = i < tiles.length ? tileW : faceW
    g.drawImage(img, x, head, w, tileH)
    g.fillText(labels[i], x + 8, head + tileH + 40)
  })
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, c.toBuffer('image/png'))
}

/**
 * Renders the stills asked for, reusing any already on disk (pass `force` to redraw). Returns
 * the PNG path of each request, in order. Full stills are cropped to the character.
 */
export async function renderCastStills(requests: StillRequest[], options: { force?: boolean; log?: (line: string) => void } = {}): Promise<string[]> {
  const log = options.log ?? (() => undefined)
  const jobs: StillJob[] = []
  const trims: string[] = []
  const sheets: { member: CastMember; views: string[]; portrait: string; out: string }[] = []
  const queue = (job: StillJob, trim: boolean) => {
    if (!options.force && fs.existsSync(job.out)) return
    if (jobs.some((j) => j.out === job.out)) return
    jobs.push(job)
    if (trim) trims.push(job.out)
  }
  const paths = requests.map((req) => {
    const out = stillPath(req)
    const pose = req.pose ?? req.member.pose
    const s = req.scale ?? 1
    if (req.shot === 'full') {
      queue({ timeline: stillTimeline(req.member, 'wide', [1200 * s, 1200 * s], pose, req.yaw ?? 0.35, req.mood, req.gaze), out, shadows: false }, true)
    } else if (req.shot === 'portrait') {
      queue({ timeline: stillTimeline(req.member, 'close', [800 * s, 800 * s], pose, req.yaw ?? 0.15, req.mood, req.gaze), out, shadows: false }, false)
    } else {
      const views = SHEET_VIEWS.map((v) => {
        const view = out.replace(/\.png$/, `.view-${v.label.toLowerCase()}.png`)
        queue({ timeline: stillTimeline(req.member, 'wide', [800 * s, 800 * s], pose, v.yaw, req.mood, req.gaze), out: view, shadows: false }, false)
        return view
      })
      const portrait = out.replace(/\.png$/, '.view-face.png')
      queue({ timeline: stillTimeline(req.member, 'close', [800 * s, 800 * s], pose, 0.15, req.mood, req.gaze), out: portrait, shadows: false }, false)
      if (options.force || !fs.existsSync(out)) sheets.push({ member: req.member, views, portrait, out })
    }
    return out
  })
  if (jobs.length) log(`Drawing ${jobs.length} still${jobs.length === 1 ? '' : 's'}${process.platform === 'linux' ? ' (software WebGL: about 20s each)' : ''}...`)
  await renderStills(jobs, (job, seconds) => log(`  ${path.relative(process.cwd(), job.out)} (${seconds.toFixed(1)}s)`))
  for (const file of trims) await trimTransparent(file)
  for (const sheet of sheets) await composeSheet(sheet.member, sheet.views, sheet.portrait, sheet.out)
  return paths
}

export interface PlateOptions {
  /** Where the character stands across the plate: left, center or right (or 0..1). */
  at?: 'left' | 'center' | 'right' | number
  /** Character height as a share of the plate height (default 0.55). */
  height?: number
  /** Gap under the feet as a share of the plate height (default 0.06). */
  floor?: number
  /** Mirror the character (to face the other way). */
  flip?: boolean
}

/**
 * Stands a full still on a painted plate (an ImageGen background) with a soft contact shadow:
 * the character stays exactly the 3D character, the image model only paints the world.
 */
export async function placeOnPlate(still: string, plate: string, out: string, options: PlateOptions = {}): Promise<string> {
  const [bg, fig] = await Promise.all([loadImage(plate), loadImage(still)])
  const c = createCanvas(bg.width, bg.height)
  const g = c.getContext('2d')
  g.drawImage(bg, 0, 0)
  const h = bg.height * (options.height ?? 0.55)
  const w = (fig.width / fig.height) * h
  const share = typeof options.at === 'number' ? options.at : { left: 0.28, center: 0.5, right: 0.72 }[options.at ?? 'center']
  // Kept inside the frame: a share near an edge stops at a small margin.
  const margin = bg.width * 0.03
  const x = Math.min(Math.max(bg.width * share - w / 2, margin), bg.width - w - margin)
  const y = bg.height * (1 - (options.floor ?? 0.06)) - h
  // Contact shadow: a soft dark ellipse under the feet.
  g.save()
  g.translate(x + w / 2, y + h * 0.97)
  g.scale(1, 0.18)
  const r = w * 0.42
  const shade = g.createRadialGradient(0, 0, 0, 0, 0, r)
  shade.addColorStop(0, 'rgba(0,0,0,0.45)')
  shade.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = shade
  g.beginPath()
  g.arc(0, 0, r, 0, Math.PI * 2)
  g.fill()
  g.restore()
  g.save()
  if (options.flip) {
    g.translate(x + w, y)
    g.scale(-1, 1)
    g.drawImage(fig, 0, 0, w, h)
  } else g.drawImage(fig, x, y, w, h)
  g.restore()
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, out.endsWith('.png') ? c.toBuffer('image/png') : c.toBuffer('image/jpeg', 92))
  return out
}

const STILL_FILE = /char_([a-z_]+)_3d_([a-z]+)_([0-9a-f]{8})\.webp/

/**
 * The local full still for a published still's file name (`char_juno_marsh_3d_wave_<hash>.webp`),
 * drawn now if it isn't on disk. Undefined when the name doesn't match the current cast and look.
 */
export async function localStillForFilename(name: string): Promise<string | undefined> {
  const m = STILL_FILE.exec(name)
  if (!m) return undefined
  const member = CAST.find((c) => c.key.replace(/^(lobster|crab)_/, '') === m[1])
  if (!member || lookHash(member) !== m[3]) return undefined
  const pose = m[2] as AvatarPose
  const [file] = await renderCastStills([{ member, shot: 'full', pose }])
  return file
}
