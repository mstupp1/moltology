/**
 * Guest-identical public documents whose SSR loaders hit Postgres.
 * CDN-cache these in production so crawlers do not wake Neon on every fetch.
 * Session chrome stays client-side (same pattern as the landing page).
 */
export const PUBLIC_DOCUMENT_CACHE_CONTROL =
  'public, max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=3600'

export function isPublicDocumentCachePath(pathname?: string | null): boolean {
  if (!pathname) return false
  if (pathname === '/') return true
  if (pathname === '/news' || pathname.startsWith('/news/')) return true
  if (pathname === '/changelog' || pathname.startsWith('/changelog/')) return true
  if (pathname === '/forum' || pathname.startsWith('/forum/')) return true
  return false
}
