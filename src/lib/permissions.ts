/**
 * Role and Super Admin permission utilities.
 * Central source of truth for super admin email recognition and effective role resolution.
 */

export const SUPER_ADMIN_EMAILS: readonly string[] = [
  'mylesstupp@gmail.com',
  'myles@moltology.org',
  'admin@moltology.org',
]

/**
 * Checks if a given email address belongs to a designated super admin.
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  return SUPER_ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

type RoleSubject = { email?: string | null; emailVerified?: boolean | null; role?: string | null }

/**
 * True when the email is on SUPER_ADMIN_EMAILS and the account has confirmed it.
 * Signup does not always require email confirmation, so an unconfirmed address
 * proves nothing about who owns it.
 */
export function isVerifiedSuperAdminEmail(user?: RoleSubject | null): boolean {
  return user?.emailVerified === true && isSuperAdminEmail(user.email)
}

/**
 * Resolves the effective role for a user given their explicit role and email.
 * A confirmed email on SUPER_ADMIN_EMAILS resolves to 'super_admin'. Server checks
 * pass JWT claims without `emailVerified`, so they rely on the stored profile role,
 * which `ensureUserProfile` sets only for confirmed addresses.
 */
export function getEffectiveRole(
  user?: RoleSubject | null,
  profileRole?: string | null
): 'super_admin' | 'admin' | 'user' | string | null {
  if (profileRole === 'super_admin' || isVerifiedSuperAdminEmail(user)) {
    return 'super_admin'
  }
  if (profileRole === 'admin' || user?.role === 'admin') {
    return 'admin'
  }
  return profileRole || user?.role || null
}

/**
 * Checks if a user is an admin or super admin.
 */
export function isAdminOrSuperAdmin(
  user?: RoleSubject | null,
  profileRole?: string | null
): boolean {
  const role = getEffectiveRole(user, profileRole)
  return role === 'admin' || role === 'super_admin'
}
