/**
 * Stores a member's portrait as an image, so other browsers can show it without drawing the
 * character in 3D. See src/lib/avatar-still.ts for how portraits are named.
 */
import { eq, sql } from 'drizzle-orm'
import { profiles } from '../../db/schema'
import { avatarStillHash, STORED_STILL_PX, storedStillKey, webpSize } from '../avatar-still'
import type { EquippedAppearance } from '../character-appearance'
import { parseLobsterAvatarConfig } from '../lobster-avatar'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

/** A 256px portrait is a few kilobytes; anything much bigger is not one of ours. */
export const MAX_STILL_BYTES = 120_000

export interface SaveAvatarStillInput {
  token?: string
  userId?: string
  /** The portrait as a WebP data URL, drawn by the member's browser. */
  image: string
}

export interface SaveAvatarStillResult {
  /** The stored portrait's name, or null when it could not be stored. */
  still: string | null
  reason?: 'no-character' | 'not-an-image' | 'storage-unavailable'
}

/** The WebP bytes inside a data URL, or null when it is not a square portrait of the right size. */
export function portraitBytes(image: string): Uint8Array | null {
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/=]+)$/.exec(image)
  if (!match) return null
  const bytes = new Uint8Array(Buffer.from(match[1], 'base64'))
  if (bytes.length > MAX_STILL_BYTES) return null
  const size = webpSize(bytes)
  return size && size.width === STORED_STILL_PX && size.height === STORED_STILL_PX ? bytes : null
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
  // Name the picture from the look other members are sent: the saved character plus worn gear.
  const hash = avatarStillHash({
    ...saved,
    accessory: undefined,
    claws: undefined,
    equipment: row.equipmentVersion === 1 ? ((row.equippedAppearance ?? {}) as EquippedAppearance) : {},
  })
  if (!hash) return { still: null, reason: 'no-character' }
  if (saved.still === hash) return { still: hash }

  try {
    const send = upload ?? (await import('../s3-client')).uploadObject
    await send({ key: storedStillKey(hash), body: bytes, contentType: 'image/webp' })
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
