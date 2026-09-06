import 'dotenv/config'
import { eq, or } from 'drizzle-orm'
import { getDb } from '../src/db'
import { profiles } from '../src/db/schema'
import { MOCK_SEED_USERS } from '../src/db/seed'

export async function backfillSimulatedUsers() {
  console.log('[BACKFILL] Connecting to database to backfill simulated users...')
  const db = getDb()

  let updatedCount = 0

  for (const mockUser of MOCK_SEED_USERS) {
    const existing = await db
      .select({ id: profiles.id, handle: profiles.handle })
      .from(profiles)
      .where(eq(profiles.id, mockUser.id))

    for (const row of existing) {
      await db
        .update(profiles)
        .set({
          isSimulated: true,
          simulatedPersona: mockUser.simulatedPersona,
          handle: row.handle || mockUser.handle,
          joinSource: mockUser.joinSource ?? 'organic',
        })
        .where(eq(profiles.id, row.id))

      console.log(`[BACKFILL] ✓ Flagged ${row.id} (${mockUser.handle}) as simulated.`)
      updatedCount++
    }
  }

  console.log(`[BACKFILL] Complete! Flagged ${updatedCount} profiles as simulated.`)
  return { success: true, updatedCount }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  backfillSimulatedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[BACKFILL] Error backfilling simulated users:', err)
      process.exit(1)
    })
}
