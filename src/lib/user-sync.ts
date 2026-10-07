import { getDb } from '../db'
import { profiles, userStats } from '../db/schema'
import { eq } from 'drizzle-orm'
import { resolveMemberLarvaId, shouldReplacePlaceholderLarvaId } from './larva-id'

/**
 * Idempotently ensures a `profiles` and `user_stats` row exist for a Better Auth user id.
 * New profiles start as `user`; staff is granted with `npm run db:grant-admin` or the admin page.
 * Real members get a unique LARVA UNIT number instead of the shared seed default.
 */
export async function ensureUserProfile(userId?: string | null) {
  if (!userId) return null
  try {
    const db = getDb()

    const uniqueLarvaId = resolveMemberLarvaId(userId)

    const [existing] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1)

    let profile = existing || null
    if (!profile) {
      const [inserted] = await db
        .insert(profiles)
        .values({ id: userId, role: 'user', larvaId: uniqueLarvaId })
        .onConflictDoNothing()
        .returning()
      profile = inserted || null
      if (!profile) {
        const [raced] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.id, userId))
          .limit(1)
        profile = raced || null
      }
    }

    if (profile && shouldReplacePlaceholderLarvaId(profile.id, profile.larvaId)) {
      const [updated] = await db
        .update(profiles)
        .set({ larvaId: uniqueLarvaId })
        .where(eq(profiles.id, userId))
        .returning()
      if (updated) profile = updated
    }

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


