import { eq, or, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { profiles } from '../../db/schema'
import { parseLobsterAvatarConfig } from '../lobster-avatar'
import { pickProfileForRouteKey } from '../member-handle'
import { shownLookHash } from './avatar-still'

type ShareLook = { avatarConfig: unknown; equipmentVersion: number | null; equippedAppearance: unknown }

/** The member's saved portrait name, when it still shows their current look (and worn gear). */
export function currentStillOf(row: ShareLook): string | null {
  const saved = parseLobsterAvatarConfig(row.avatarConfig)
  if (!saved?.still) return null
  const hash = shownLookHash(saved, row)
  return hash && saved.still === hash ? hash : null
}

export async function getMemberShareIdentity(profileId: string) {
  const key = profileId.trim()
  if (!key || key.length > 128) return null
  // Intentionally exclude auth names, emails, bios, stats, and loadouts. The portrait is the
  // same picture any visitor's browser is already sent.
  const rows = await getDb()
    .select({
      id: profiles.id,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      avatarConfig: profiles.avatarConfig,
      equipmentVersion: profiles.equipmentVersion,
      equippedAppearance: profiles.equippedAppearance,
    })
    .from(profiles)
    .where(or(eq(profiles.id, key), sql`lower(${profiles.handle}) = ${key.toLowerCase()}`))
    .limit(2)
  const member = pickProfileForRouteKey(key, rows)
  return member ? { userId: member.id, handle: member.handle, larvaId: member.larvaId, still: currentStillOf(member) } : null
}
