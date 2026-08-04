import { getDb } from '../db'
import { profiles, userStats } from '../db/schema'
import { eq, sql } from 'drizzle-orm'

export const SUPER_ADMIN_EMAILS = ['mylesstupp@gmail.com']

/**
 * Idempotently ensures a `profiles` and `user_stats` row exist for a Neon Auth user id.
 * Automatically elevates known super admin accounts (e.g. mylesstupp@gmail.com) in `profiles`.
 */
export async function ensureUserProfile(userId?: string | null) {
  if (!userId) return null
  try {
    const db = getDb()

    let isSuperAdmin = false
    try {
      const authUserRes = await db.execute(
        sql`SELECT email FROM neon_auth.user WHERE id::text = ${userId} LIMIT 1`
      )
      const email = (authUserRes?.rows?.[0] as { email?: string } | undefined)?.email
      if (email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase())) {
        isSuperAdmin = true
      }
    } catch {
      // Fallback if neon_auth.user table cannot be queried directly
    }

    const initialRole = isSuperAdmin ? 'super_admin' : 'user'
    const insertQuery = db
      .insert(profiles)
      .values({ id: userId, role: initialRole })

    const [profile] = isSuperAdmin
      ? await insertQuery
          .onConflictDoUpdate({
            target: profiles.id,
            set: { role: 'super_admin' },
          })
          .returning()
      : await insertQuery.onConflictDoNothing().returning()

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


