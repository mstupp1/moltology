/**
 * The forum's group photo. The server never draws it: it says when the stored photo should be
 * retaken and stores the one a visitor's browser drew. See src/lib/community-photo.ts.
 */
import { asc, eq, isNotNull } from 'drizzle-orm'
import { getDb } from '../../db'
import { communityPhotos, profiles } from '../../db/schema'
import { webpSize } from '../avatar-still'
import type { EquippedAppearance } from '../character-appearance'
import {
  castHash,
  COMMUNITY_PHOTO_ID,
  MAX_CAST,
  MAX_PHOTO_BYTES,
  PHOTO_HEIGHT,
  PHOTO_WIDTH,
  photoDue,
  photoKey,
  type CastMember,
  type CommunityPhotoSpot,
  type CommunityPhotoState,
} from '../community-photo'
import { parseLobsterAvatarConfig } from '../lobster-avatar'
import { resolveMemberPublicName, resolveMemberPublicParam } from '../member-handle'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

/** Everyone with a saved character, earliest to join first, as other members see them. */
export async function loadCast(db: Db): Promise<CastMember[]> {
  const rows = await db
    .select({
      id: profiles.id,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      avatarConfig: profiles.avatarConfig,
      equipmentVersion: profiles.equipmentVersion,
      equippedAppearance: profiles.equippedAppearance,
    })
    .from(profiles)
    .where(isNotNull(profiles.avatarConfig))
    .orderBy(asc(profiles.createdAt), asc(profiles.id))
    .limit(MAX_CAST * 2)
  const cast: CastMember[] = []
  for (const row of rows) {
    const saved = parseLobsterAvatarConfig(row.avatarConfig)
    if (!saved) continue
    const { still: _still, ...look } = saved
    cast.push({
      id: row.id,
      name: resolveMemberPublicName({ userId: row.id, handle: row.handle, larvaId: row.larvaId }),
      profile: resolveMemberPublicParam({ id: row.id, handle: row.handle }),
      config: {
        ...look,
        accessory: undefined,
        claws: undefined,
        equipment: row.equipmentVersion === 1 ? ((row.equippedAppearance ?? {}) as EquippedAppearance) : {},
      },
    })
    if (cast.length >= MAX_CAST) break
  }
  return cast
}

async function loadPhoto(db: Db) {
  const [row] = await db.select().from(communityPhotos).where(eq(communityPhotos.id, COMMUNITY_PHOTO_ID)).limit(1)
  return row ?? null
}

/** The stored photo, with names on its faces, and whether this visitor should retake it. */
export async function getCommunityPhotoHandler(_args?: unknown, db: Db = getDb()): Promise<CommunityPhotoState> {
  const [cast, row] = await Promise.all([loadCast(db), loadPhoto(db)])
  const hash = castHash(cast)
  const due = cast.length > 0 && photoDue(row, hash)
  const members = new Map(cast.map((m) => [m.id, m]))
  const photo = row
    ? {
        url: `/media/${row.imageKey}`,
        width: row.width,
        height: row.height,
        takenAt: row.takenAt.toISOString(),
        // A member who has left, or removed their character, is no longer named or linked.
        spots: row.spots.flatMap((spot) => {
          const member = members.get(spot.id)
          return member ? [{ ...spot, name: member.name, profile: member.profile }] : []
        }),
      }
    : null
  return { photo, due, castHash: hash, cast: due ? cast : undefined }
}

export interface SaveCommunityPhotoInput {
  token?: string
  userId?: string
  castHash: string
  /** The photo as a WebP data URL, drawn by the visitor's browser. */
  image: string
  spots: CommunityPhotoSpot[]
}

export interface SaveCommunityPhotoResult {
  saved: boolean
  reason?: 'not-due' | 'cast-changed' | 'not-an-image' | 'bad-spots' | 'storage-unavailable'
}

/** The WebP bytes inside a data URL, or null unless it is a photo of exactly the right size. */
export function photoBytes(image: string): Uint8Array | null {
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(image)
  if (!match) return null
  const bytes = new Uint8Array(Buffer.from(match[1], 'base64'))
  if (bytes.length > MAX_PHOTO_BYTES) return null
  const size = webpSize(bytes)
  return size && size.width === PHOTO_WIDTH && size.height === PHOTO_HEIGHT ? bytes : null
}

type Upload = (params: { key: string; body: Uint8Array; contentType: string }) => Promise<void>

/**
 * Store a retaken photo. Only a signed-in member can send one, and only while a retake is due
 * for exactly the cast the server sees now, so a photo cannot be replaced at will.
 */
export async function saveCommunityPhotoHandler(
  { data, context }: { data?: SaveCommunityPhotoInput | null; context?: WriteAuthContext | null },
  upload?: Upload,
  db: Db = getDb(),
): Promise<SaveCommunityPhotoResult> {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to save the group photo.')
  if (!data) throw new Error('Missing photo.')

  const [cast, row] = await Promise.all([loadCast(db), loadPhoto(db)])
  const hash = castHash(cast)
  if (data.castHash !== hash) return { saved: false, reason: 'cast-changed' }
  if (!photoDue(row, hash)) return { saved: false, reason: 'not-due' }

  const bytes = photoBytes(data.image)
  if (!bytes) return { saved: false, reason: 'not-an-image' }
  const ids = new Set(cast.map((m) => m.id))
  const inRange = (n: number) => Number.isFinite(n) && n >= 0 && n <= 1
  const spots = data.spots.map(({ id, x, y, r }) => ({ id, x, y, r }))
  if (spots.length !== cast.length || new Set(spots.map((s) => s.id)).size !== spots.length || spots.some((s) => !ids.has(s.id) || !inRange(s.x) || !inRange(s.y) || !inRange(s.r))) {
    return { saved: false, reason: 'bad-spots' }
  }

  const key = photoKey(hash)
  try {
    const send = upload ?? (await import('../s3-client')).uploadObject
    await send({ key, body: bytes, contentType: 'image/webp' })
  } catch (error) {
    console.warn('[community-photo] photo not stored:', error instanceof Error ? error.message : error)
    return { saved: false, reason: 'storage-unavailable' }
  }
  const values = { castHash: hash, imageKey: key, width: PHOTO_WIDTH, height: PHOTO_HEIGHT, spots, takenBy: auth.userId, takenAt: new Date() }
  await db
    .insert(communityPhotos)
    .values({ id: COMMUNITY_PHOTO_ID, ...values })
    .onConflictDoUpdate({ target: communityPhotos.id, set: values })
  return { saved: true }
}
