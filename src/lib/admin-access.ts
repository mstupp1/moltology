/**
 * Staff-only HUD paths. These are official steward tools, not hidden member chambers.
 * Clearance is still `isAdminOrSuperAdmin` via `useHiddenPageAccess`.
 */
export const ADMIN_ONLY_PATHS = ['/admin', '/watch'] as const

export type AdminOnlyPath = (typeof ADMIN_ONLY_PATHS)[number]

export function isAdminOnlyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = pathname.split('#')[0]?.split('?')[0] ?? '/'
  const normalized = path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
  return ADMIN_ONLY_PATHS.some((adminPath) => normalized === adminPath || normalized.startsWith(`${adminPath}/`))
}
