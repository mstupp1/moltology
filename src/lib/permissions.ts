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

/**
 * Resolves the effective role for a user given their explicit role and email.
 * Defaults to 'super_admin' if the email matches SUPER_ADMIN_EMAILS.
 */
export function getEffectiveRole(
  user?: { email?: string | null; role?: string | null } | null,
  profileRole?: string | null
): 'super_admin' | 'admin' | 'user' | string | null {
  if (profileRole === 'super_admin' || isSuperAdminEmail(user?.email)) {
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
  user?: { email?: string | null; role?: string | null } | null,
  profileRole?: string | null
): boolean {
  const role = getEffectiveRole(user, profileRole)
  return role === 'admin' || role === 'super_admin'
}
