import { getDb } from '../db'
import { profiles, userStats } from '../db/schema'
import { eq } from 'drizzle-orm'

/**
 * Idempotently ensures a `profiles` and `user_stats` row exist for a Neon Auth user id.
 *
 * Neon Managed Auth does not create a `profiles` row for new users, but tables
 * like `ai_threads`, `user_stats`, and `assets` FK-reference `profiles.id`.
 * Without a matching row, writes silently fail. This upsert guarantees the
 * profile and default stats exist the first time a user is seen.
 */
export async function ensureUserProfile(userId?: string | null) {
  if (!userId) return null
  try {
    const db = getDb()
    const [profile] = await db
      .insert(profiles)
      .values({ id: userId })
      .onConflictDoNothing()
      .returning()

    // Idempotently ensure user_stats row exists for profile
    const existingStats = await db
      .select({ id: userStats.id })
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .limit(1)

    if (existingStats.length === 0) {
      await db
        .insert(userStats)
        .values({ userId })
        .onConflictDoNothing()
    }

    return profile || null
  } catch (error) {
    console.warn('[user-sync] Failed to ensure profile row:', error)
    return null
  }
}

