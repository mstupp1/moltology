/**
 * Stores a member's portrait as an image, so other browsers can show it without drawing the
 * character in 3D. See src/lib/avatar-still.ts for how portraits are named.
 */
import { eq, sql } from 'drizzle-orm'
import { profiles } from '../../db/schema'
import { avatarStillHash, LARGE_STILL_PX, largeStillKey, STORED_STILL_PX, storedStillKey, webpSize } from '../avatar-still'
import type { EquippedAppearance } from '../character-appearance'
import { parseLobsterAvatarConfig, type LobsterAvatarConfig } from '../lobster-avatar'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

/** A 256px portrait is a few kilobytes; anything much bigger is not one of ours. */
export const MAX_STILL_BYTES = 120_000

/** The 512px copy for share cards: about four times the pixels. */
export const MAX_LARGE_STILL_BYTES = 400_000

export interface SaveAvatarStillInput {
  token?: string
  userId?: string
  /** The portrait as a WebP data URL, drawn by the member's browser. */
  image: string
  /** The same portrait at 512px, kept for share cards. Optional. */
  large?: string
}

export interface SaveAvatarStillResult {
  /** The stored portrait's name, or null when it could not be stored. */
  still: string | null
  reason?: 'no-character' | 'not-an-image' | 'storage-unavailable'
}

/** The WebP bytes inside a data URL, or null when it is not a square portrait of the right size. */
export function portraitBytes(image: string, px = STORED_STILL_PX, maxBytes = MAX_STILL_BYTES): Uint8Array | null {
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(image)
  if (!match) return null
  const bytes = new Uint8Array(Buffer.from(match[1], 'base64'))
  if (bytes.length > maxBytes) return null
  const size = webpSize(bytes)
  return size && size.width === px && size.height === px ? bytes : null
}

/** Name a portrait from the look other members are sent: the saved character plus worn gear. */
export function shownLookHash(
  saved: LobsterAvatarConfig,
  row: { equipmentVersion: number | null; equippedAppearance: unknown },
): string | null {
  return avatarStillHash({
    ...saved,
    accessory: undefined,
    claws: undefined,
    equipment: row.equipmentVersion === 1 ? ((row.equippedAppearance ?? {}) as EquippedAppearance) : {},
  })
}

type Upload = (params: { key: string; body: Uint8Array; contentType: string }) => Promise<void>

export async function saveAvatarStillHandler(
  { data, context }: { data?: SaveAvatarStillInput | null; context?: WriteAuthContext | null },
  upload?: Upload,
): Promise<SaveAvatarStillResult> {
  const auth = await resolveWriteAuth({ data, context })
  if (!auth) throw new Error('Unauthenticated: Authentication required to save a portrait.')
  if (!data) throw new Error('Missing portrait.')
  const bytes = portraitBytes(data.image)
  if (!bytes) return { still: null, reason: 'not-an-image' }

  const [row] = await auth.dbClient
    .select({ avatarConfig: profiles.avatarConfig, equipmentVersion: profiles.equipmentVersion, equippedAppearance: profiles.equippedAppearance })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1)
  const saved = parseLobsterAvatarConfig(row?.avatarConfig)
  if (!saved) return { still: null, reason: 'no-character' }
  const hash = shownLookHash(saved, row)
  if (!hash) return { still: null, reason: 'no-character' }
  if (saved.still === hash) return { still: hash }

  try {
    const send = upload ?? (await import('../s3-client')).uploadObject
    await send({ key: storedStillKey(hash), body: bytes, contentType: 'image/webp' })
    // The sharp copy is a nice-to-have: a bad or missing one never blocks the portrait.
    const large = data.large ? portraitBytes(data.large, LARGE_STILL_PX, MAX_LARGE_STILL_BYTES) : null
    if (large) await send({ key: largeStillKey(hash), body: large, contentType: 'image/webp' }).catch(() => {})
  } catch (error) {
    console.warn('[avatar-still] portrait not stored:', error instanceof Error ? error.message : error)
    return { still: null, reason: 'storage-unavailable' }
  }
  await auth.dbClient
    .update(profiles)
    .set({ avatarConfig: sql`jsonb_set(${profiles.avatarConfig}, '{still}', to_jsonb(${hash}::text))` })
    .where(eq(profiles.id, auth.userId))
  return { still: hash }
}
