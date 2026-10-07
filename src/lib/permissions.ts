/**
 * Role utilities. There is one staff role, `admin`, stored on `profiles.role`.
 */

export type MemberRole = 'user' | 'admin'

type RoleSubject = { role?: string | null }

/**
 * Resolves the effective role from the stored profile role, then the session role.
 * The retired `super_admin` value counts as admin until the migration that
 * rewrites it has run everywhere.
 */
export function getEffectiveRole(
  user?: RoleSubject | null,
  profileRole?: string | null
): MemberRole | string | null {
  if (profileRole === 'admin' || profileRole === 'super_admin' || user?.role === 'admin') {
    return 'admin'
  }
  return profileRole || user?.role || null
}

/**
 * Checks if a user is staff (admin).
 */
export function isAdmin(
  user?: RoleSubject | null,
  profileRole?: string | null
): boolean {
  return getEffectiveRole(user, profileRole) === 'admin'
}
