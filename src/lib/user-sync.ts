import { getDb } from '../db'
import { profiles, userStats } from '../db/schema'
import { eq, sql } from 'drizzle-orm'
import { SUPER_ADMIN_EMAILS, isVerifiedSuperAdminEmail } from './permissions'
import { resolveMemberLarvaId, shouldReplacePlaceholderLarvaId } from './larva-id'

export { SUPER_ADMIN_EMAILS }

/**
 * Idempotently ensures a `profiles` and `user_stats` row exist for a Better Auth user id.
 * Elevates super admin accounts in `profiles` once their allowlisted email is confirmed.
 * Real members get a unique LARVA UNIT number instead of the shared seed default.
 */
export async function ensureUserProfile(userId?: string | null) {
  if (!userId) return null
  try {
    const db = getDb()

    let isSuperAdmin = false
    try {
      const authUserRes = await db.execute(
        sql`SELECT email, "emailVerified" FROM "user" WHERE id = ${userId} LIMIT 1`
      )
      const authRow = authUserRes?.rows?.[0] as { email?: string; emailVerified?: boolean } | undefined
      // Signup can skip email confirmation, so only a confirmed address earns the role.
      if (isVerifiedSuperAdminEmail(authRow)) {
        isSuperAdmin = true
      }
    } catch {
      // The legacy neon_auth table is not consulted for elevation: it carries no
      // confirmation flag this code can trust.
    }

    const initialRole = isSuperAdmin ? 'super_admin' : 'user'
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
        .values({ id: userId, role: initialRole, larvaId: uniqueLarvaId })
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
    } else if (isSuperAdmin && profile.role !== 'super_admin') {
      const [updatedRole] = await db
        .update(profiles)
        .set({ role: 'super_admin' })
        .where(eq(profiles.id, userId))
        .returning()
      if (updatedRole) profile = updatedRole
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


