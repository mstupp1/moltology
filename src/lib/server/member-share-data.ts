import { eq, or, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { profiles } from '../../db/schema'
import { pickProfileForRouteKey } from '../member-handle'

export async function getMemberShareIdentity(profileId: string) {
  const key = profileId.trim()
  if (!key || key.length > 128) return null
  // Intentionally exclude auth names, emails, bios, stats, and loadouts.
  const rows = await getDb().select({ id: profiles.id, handle: profiles.handle, larvaId: profiles.larvaId })
    .from(profiles)
    .where(or(eq(profiles.id, key), sql`lower(${profiles.handle}) = ${key.toLowerCase()}`))
    .limit(2)
  const member = pickProfileForRouteKey(key, rows)
  return member ? { userId: member.id, handle: member.handle, larvaId: member.larvaId } : null
}
