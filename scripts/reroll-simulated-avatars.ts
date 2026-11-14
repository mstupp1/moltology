/**
 * Give every simulated member a fresh, varied character (src/lib/simulated-avatar.ts).
 * Only rows with isSimulated = true are touched; real members are never read for writing.
 *
 *   npm run simulate:reroll-avatars            # dry run: prints the new looks, writes nothing
 *   npm run simulate:reroll-avatars -- --apply # writes avatarConfig and bumps appearanceRevision
 *
 * Targets DATABASE_URL. For production, use the simulation-runner production wrapper.
 * Gear is left alone. The forum group photo retakes itself on its next due visit.
 */
import 'dotenv/config'
import { and, asc, eq, sql } from 'drizzle-orm'
import { getDb } from '../src/db'
import { profiles } from '../src/db/schema'
import { rollSimulatedCast } from '../src/lib/simulated-avatar'

export async function rerollSimulatedAvatars({ apply = false } = {}) {
  const db = getDb()
  const target = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).hostname : 'unknown'
  console.log(`[REROLL] Target: ${target} (${apply ? 'apply' : 'dry run'})`)

  const rows = await db
    .select({ id: profiles.id, handle: profiles.handle })
    .from(profiles)
    .where(eq(profiles.isSimulated, true))
    .orderBy(asc(profiles.createdAt))

  const looks = rollSimulatedCast(rows.length)
  for (const [i, row] of rows.entries()) {
    const look = looks[i]
    console.log(`[REROLL] ${row.handle ?? row.id}: ${look.race} · ${look.shellColor} ${look.shellFinish} · ${look.marking} · ${look.headShape}/${look.build} · ${look.height}`)
    if (!apply) continue
    await db
      .update(profiles)
      .set({
        avatarConfig: look,
        appearanceRevision: sql`${profiles.appearanceRevision} + 1`,
        updatedAt: new Date(),
      })
      // Re-check the flag on write so a real member can never be changed.
      .where(and(eq(profiles.id, row.id), eq(profiles.isSimulated, true)))
  }
  console.log(`[REROLL] ${apply ? 'Updated' : 'Would update'} ${rows.length} simulated members.`)
  return { target, count: rows.length, applied: apply }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  rerollSimulatedAvatars({ apply: process.argv.includes('--apply') })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[REROLL] Failed:', err)
      process.exit(1)
    })
}
