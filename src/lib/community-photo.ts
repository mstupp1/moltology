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
export const PHOTO_VERSION = 1
export const COMMUNITY_PHOTO_ID = 'forum'
export const PHOTO_WIDTH = 1800
export const PHOTO_HEIGHT = 720
/** A photo is retaken at most this often, however often the cast changes. */
export const RETAKE_AFTER_MS = 24 * 60 * 60 * 1000
/** A 1800×720 WebP of the group is a few hundred kilobytes at most. */
export const MAX_PHOTO_BYTES = 1_500_000
/** Most characters in one photo. Past this, the earliest members to join are shown. */
export const MAX_CAST = 48
/** Characters in one row of the photo. */
export const ROW_SIZE = 8

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
}

const SPACING = 1.4
const ROW_DEPTH = 1.5
const STEP = 0.85

/**
 * A team-photo layout: the first members stand in the front row, later ones on steps behind.
 * Rows alternate between a full row and one place shorter, so each back-row face sits in the gap
 * between two heads in front.
 */
export function groupLayout(count: number): Placement[] {
  if (count <= 0) return []
  // Every other row is one place short, so allow for that when counting rows.
  let rows = Math.ceil(count / ROW_SIZE)
  while (rows * ROW_SIZE - Math.floor(rows / 2) < count) rows++
  const full = Math.ceil((count + Math.floor(rows / 2)) / rows)
  const out: Placement[] = []
  let placed = 0
  let below = 0
  for (let row = 0; row < rows && placed < count; row++) {
    const inRow = Math.min(row % 2 === 0 ? full : full - 1, count - placed)
    // Rows of the same parity would line up head behind head: move this one half a place over.
    const shift = row > 0 && inRow % 2 === below % 2 ? (row % 2 ? 0.5 : -0.5) * SPACING : 0
    for (let i = 0; i < inRow; i++) {
      out.push({ x: (i - (inRow - 1) / 2) * SPACING + shift, z: -row * ROW_DEPTH, y: row * STEP, row })
    }
    placed += inRow
    below = inRow
  }
  return out
}
