import { getDb } from '../db'
import { profiles } from '../db/schema'

/**
 * Idempotently ensures a `profiles` row exists for a Neon Auth user id.
 *
 * Neon Managed Auth does not create a `profiles` row for new users, but tables
 * like `ai_threads`, `user_stats`, and `assets` FK-reference `profiles.id`.
 * Without a matching row, writes silently fail. This upsert guarantees the
 * row exists the first time a user is seen.
 */
export async function ensureUserProfile(userId?: string | null) {
  if (!userId) return
  try {
    await getDb()
      .insert(profiles)
      .values({ id: userId })
      .onConflictDoNothing()
  } catch (error) {
    console.warn('[user-sync] Failed to ensure profile row:', error)
  }
}
