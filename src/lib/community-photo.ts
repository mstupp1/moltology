/**
 * The forum's group photo: every member's character posed together in one picture.
 *
 * Nothing is drawn on a schedule or on the server. When someone opens the forum, the server says
 * whether the stored photo is out of date (the cast changed, and the photo is old enough to
 * retake). If it is, that visitor's browser draws the new photo with the 3D renderer it already
 * has and sends it to be stored. Everyone else sees the stored image, however old.
 *
 * Shared by the browser and the server, so it must not import the 3D renderer.
 */
import type { AvatarPose } from './avatar/traits'
import { avatarStillHash, shortHash, STILL_VERSION } from './avatar-still'
import type { LobsterAvatarConfig } from './lobster-avatar'

/** Bump when the photo's layout, lighting or framing changes, so the next visit retakes it. */
export const PHOTO_VERSION = 3
export const COMMUNITY_PHOTO_ID = 'forum'
export const PHOTO_WIDTH = 1800
export const PHOTO_HEIGHT = 600
/** A photo is retaken at most this often, however often the cast changes. */
export const RETAKE_AFTER_MS = 24 * 60 * 60 * 1000
/** A 1800×600 WebP of the group is a few hundred kilobytes at most. */
export const MAX_PHOTO_BYTES = 1_500_000
/** Most characters in one photo. Past this, the earliest members to join are shown. */
export const MAX_CAST = 48
/** Most characters in one row of the photo. Rows are as wide as it takes to fill the frame. */
export const ROW_SIZE = 14
/** Fewest characters in one row, so a small cast still stands in rows and fills the height. */
const MIN_ROW_SIZE = 3

/** Where a member's head is in the photo, as fractions of the image's width and height. */
export interface CommunityPhotoSpot {
  id: string
  x: number
  y: number
  /** Radius of the head, as a fraction of the image's width. */
  r: number
}

export interface CastMember {
  id: string
  name: string
  /** Their profile address: handle, or id until they pick one. */
  profile: string
  /** The look other members are sent: saved character plus worn gear. */
  config: LobsterAvatarConfig
}

export interface CommunityPhoto {
  url: string
  width: number
  height: number
  takenAt: string
  spots: (CommunityPhotoSpot & { name: string; profile: string })[]
}

export interface CommunityPhotoState {
  photo: CommunityPhoto | null
  /** The photo should be retaken. Only then is the cast sent. */
  due: boolean
  castHash: string
  cast?: CastMember[]
}

/** Friendly poses for the photo, one per member, the same every time. */
const PHOTO_POSES: AvatarPose[] = ['wave', 'cheer', 'victory', 'flex', 'point', 'ready', 'rest', 'strut']

export function photoPose(memberId: string): AvatarPose {
  return PHOTO_POSES[parseInt(shortHash(memberId).slice(-4), 36) % PHOTO_POSES.length]
}

/** Who is in the photo and how each looks, in the order they stand. Any change retakes it. */
export function castHash(cast: readonly Pick<CastMember, 'id' | 'config'>[]): string {
  const faces = cast.map((m) => `${m.id}:${avatarStillHash(m.config) ?? '-'}`).join(',')
  return shortHash(`p${PHOTO_VERSION}|s${STILL_VERSION}|${faces}`)
}

export function photoKey(hash: string): string {
  return `community/photo-v${PHOTO_VERSION}-${hash}.webp`
}

/** The stored photo should be retaken: there is none yet, or the cast changed and it is old enough. */
export function photoDue(photo: { castHash: string; takenAt: Date | string } | null | undefined, hash: string, now = Date.now()): boolean {
  if (!photo) return true
  if (photo.castHash === hash) return false
  return now - new Date(photo.takenAt).getTime() >= RETAKE_AFTER_MS
}

/** Where one member stands: across, back from the front row, and up onto a step. */
export interface Placement {
  x: number
  z: number
  y: number
  row: number
  /** Small lean toward the middle of the group, in radians (positive leans left). */
  lean: number
}

/** A character's measured size, in world units, standing at the origin. */
export interface Figure {
  id: string
  /** Top of the tallest part: antennae, hat or raised claw. */
  height: number
  /** Width across, claws included. */
  width: number
  /** Height of the middle of the face. */
  face: number
  /** Radius of the head. */
  head: number
}

const ROW_DEPTH = 1.35
/** Neighbours stand this much closer than their widths, so shoulders and claws overlap a little. */
const SQUEEZE = 0.74
/** How far the camera looks down: a step back reads this much higher in the photo. */
const CAMERA_DROP = 0.12
/** How far below the middle of a face must clear the head in front, in head radii. */
const FACE_CLEAR = 0.6

/** A steady number in [-1, 1] for this text, so a cast always stands the same way. */
function wobble(text: string): number {
  return (parseInt(shortHash(text).slice(-5), 36) % 2001) / 1000 - 1
}

/** How many stand in each row, front first: alternating a full row and one place shorter. */
export function rowSizes(count: number, rowSize = ROW_SIZE): number[] {
  if (count <= 0) return []
  let rows = Math.ceil(count / rowSize)
  while (rows * rowSize - Math.floor(rows / 2) < count) rows++
  const full = Math.ceil((count + Math.floor(rows / 2)) / rows)
  const sizes: number[] = []
  let left = count
  for (let row = 0; row < rows && left > 0; row++) {
    const n = Math.min(row % 2 === 0 ? full : full - 1, left)
    sizes.push(n)
    left -= n
  }
  return sizes
}

/** Tallest in the middle, then alternately right and left of them, shortest at the ends. */
function middleOut<T>(tallestFirst: T[]): T[] {
  const out: T[] = []
  tallestFirst.forEach((item, i) => (i % 2 === 0 ? out.push(item) : out.unshift(item)))
  return out
}

/** How much of `back`'s face the heads in `front` hide, in world units (0 when it is clear). */
function hidden(back: { x: number; y: number; fig: Figure }, front: { x: number; y: number; fig: Figure }[]): number {
  const faceY = back.y + back.fig.face
  let worst = 0
  for (const f of front) {
    // Only what is directly in front of the face can hide it: the head, antennae or hat.
    const reach = f.fig.head * 1.15 + back.fig.head * 0.8
    const across = Math.abs(f.x - back.x)
    if (across >= reach) continue
    // The top of the head in front (antennae are thin enough to see past), against the lower
    // part of this face. Standing a row back reads a little higher, as the camera looks down.
    const top = f.y + f.fig.face + f.fig.head * 1.05 - ROW_DEPTH * CAMERA_DROP
    const cover = top - (faceY - back.fig.head * FACE_CLEAR)
    // Partly to the side hides less of the face.
    worst = Math.max(worst, cover * (1 - across / reach))
  }
  return Math.max(0, worst)
}

/**
 * Arrange a group for the photo, the way people line up for one: the shortest in front and the
 * tallest behind, the tallest of each row in its middle, neighbours squeezed in a little, each
 * back row on a step just high enough to show its faces, and faces sitting between the heads in
 * front. Returns one placement per figure, in the order given.
 */
export function arrangeGroup(figures: readonly Figure[], rowSize = ROW_SIZE): Placement[] {
  if (!figures.length) return []
  const byHeight = [...figures].sort((a, b) => a.height - b.height || (a.id < b.id ? -1 : 1))
  const placed = new Map<string, Placement>()
  let front: { x: number; y: number; fig: Figure }[] = []
  let used = 0
  let lastY = 0
  rowSizes(figures.length, rowSize).forEach((size, row) => {
    const members = middleOut(byHeight.slice(used, used + size).reverse())
    used += size
    // Squeeze neighbours together by their widths, a little more or less for each pair.
    const xs = [0]
    for (let i = 1; i < members.length; i++) {
      const a = members[i - 1]
      const b = members[i]
      const squeeze = SQUEEZE + 0.05 * wobble(`${a.id}|${b.id}`)
      xs.push(xs[i - 1] + ((a.width + b.width) / 2) * squeeze)
    }
    // Centre the row on its tallest (or its two tallest), so they stand in the middle of the photo.
    const mid = (xs[Math.floor((xs.length - 1) / 2)] + xs[Math.ceil((xs.length - 1) / 2)]) / 2
    let row0 = members.map((fig, i) => ({ fig, x: xs[i] - mid, y: 0 }))

    let y = 0
    if (row > 0) {
      // Slide the row sideways so its faces sit between the heads in front, then raise its step
      // only as far as it takes to show every face.
      const width = Math.max(...front.map((f) => f.fig.width)) * SQUEEZE
      let best = { shift: 0, cost: Infinity }
      for (let k = -10; k <= 10; k++) {
        const shift = (k / 20) * width
        const cost = row0.reduce((sum, m) => sum + hidden({ ...m, x: m.x + shift, y: lastY }, front), 0) + Math.abs(shift) * 0.05
        if (cost < best.cost - 1e-9) best = { shift, cost }
      }
      row0 = row0.map((m) => ({ ...m, x: m.x + best.shift }))
      // Anyone still hidden steps a little to the side, toward the nearer gap.
      row0 = row0.map((m) => {
        let bestX = m.x
        let bestHide = hidden({ ...m, y: lastY }, front)
        for (const dx of [-0.3, 0.3, -0.18, 0.18]) {
          const h = hidden({ ...m, x: m.x + dx, y: lastY }, front)
          if (h < bestHide - 1e-6) {
            bestHide = h
            bestX = m.x + dx
          }
        }
        return { ...m, x: bestX }
      })
      let need = 0
      for (const m of row0) need = Math.max(need, hidden({ ...m, y: lastY }, front))
      y = lastY + Math.max(0.25, need)
    }
    const z = -row * ROW_DEPTH
    for (const m of row0) {
      placed.set(m.fig.id, {
        x: m.x,
        y,
        z: z + 0.08 * wobble(`z|${m.fig.id}`),
        row,
        lean: -Math.max(-0.05, Math.min(0.05, m.x * 0.012)) + 0.015 * wobble(`lean|${m.fig.id}`),
      })
    }
    front = row0.map((m) => ({ ...m, y }))
    lastY = y
  })
  return figures.map((f) => placed.get(f.id)!)
}

/** Width over height of the group as the camera sees it, looking down a little at the back rows. */
export function groupAspect(figures: readonly Figure[], layout: readonly Placement[]): number {
  let left = Infinity
  let right = -Infinity
  let top = -Infinity
  let deep = 0
  layout.forEach((p, i) => {
    left = Math.min(left, p.x - figures[i].width / 2)
    right = Math.max(right, p.x + figures[i].width / 2)
    top = Math.max(top, p.y + figures[i].height)
    deep = Math.max(deep, -p.z)
  })
  return (right - left) / (top + deep * CAMERA_DROP * 2)
}

/**
 * Arrange the group in rows as wide as it takes for its shape to match the photo's, so the
 * characters fill the frame edge to edge instead of leaving dark space at the sides.
 */
export function arrangeToFill(figures: readonly Figure[], aspect = PHOTO_WIDTH / PHOTO_HEIGHT): Placement[] {
  let best: { layout: Placement[]; miss: number } | null = null
  const most = Math.min(ROW_SIZE, figures.length)
  for (let size = Math.min(MIN_ROW_SIZE, most); size <= most; size++) {
    const layout = arrangeGroup(figures, size)
    const miss = Math.abs(Math.log(groupAspect(figures, layout) / aspect))
    if (!best || miss < best.miss - 1e-6) best = { layout, miss }
  }
  return best?.layout ?? []
}
