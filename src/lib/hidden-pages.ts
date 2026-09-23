/**
 * Hidden pages stay out of navigation and search for members.
 * Admins and super admins can still open them. The sidebar shows those
 * entries faded, with a hidden icon, so staff can tell them apart.
 */
import { isAdminOrSuperAdmin } from './permissions'

export const HIDDEN_PAGES = [
  {
    id: 'subterranean',
    path: '/subterranean',
  },
  {
    id: 'premium',
    path: '/premium',
  },
  {
    id: 'store',
    path: '/store',
  },
] as const

export type HiddenPageId = (typeof HIDDEN_PAGES)[number]['id']

export const HIDDEN_PAGE_PATHS: readonly string[] = HIDDEN_PAGES.map((page) => page.path)

export function normalizeAppPath(pathname: string): string {
  const withoutHash = pathname.split('#')[0] ?? '/'
  const withoutQuery = withoutHash.split('?')[0] ?? '/'
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery || '/'
}

/** True when this path is a hidden page, including nested routes under it. */
export function isHiddenPagePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  const path = normalizeAppPath(pathname)
  return HIDDEN_PAGE_PATHS.some((hidden) => path === hidden || path.startsWith(`${hidden}/`))
}

/**
 * Admins and super admins may see hidden pages.
 * `profileRole` covers clearance stored on the profile when the session role is still a member.
 */
export function canViewHiddenPages(
  user?: { email?: string | null; role?: string | null } | null,
  profileRole?: string | null,
): boolean {
  return isAdminOrSuperAdmin(user, profileRole)
}
