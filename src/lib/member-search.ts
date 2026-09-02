import type { MemberSearchResult } from './connections'

/** Minimum characters before people search fires (Connections, palette, /search). */
export const MEMBER_SEARCH_MIN_CHARS = 2

/** Debounce for live people search. Shared by Connections, palette, and /search. */
export const MEMBER_SEARCH_DEBOUNCE_MS = 280

/** Prefix / contains scan is enough; keep the trench small. */
export const MEMBER_SEARCH_LIMIT = 20

export type MemberSearchFields = Pick<MemberSearchResult, 'handle' | 'larvaId' | 'displayName'>

/**
 * Strip LIKE wildcards so a designation search cannot widen itself.
 * Handle, larva unit, and display name still match as ordinary text.
 */
export function sanitizeMemberSearchQuery(raw: string): string {
  return raw.trim().replace(/[%_\\]/g, '').slice(0, 80)
}

/**
 * Lower rank is better. Handle first, then larva unit, then display name.
 * Prefix beats a contains match inside the same field.
 */
export function memberSearchRank(query: string, member: MemberSearchFields): number {
  const q = sanitizeMemberSearchQuery(query).toLowerCase()
  if (q.length < MEMBER_SEARCH_MIN_CHARS) return 99

  const handle = (member.handle ?? '').trim().toLowerCase()
  const larvaId = member.larvaId.trim().toLowerCase()
  const displayName = member.displayName.trim().toLowerCase()

  if (handle && handle.startsWith(q)) return 0
  if (handle && handle.includes(q)) return 1
  if (larvaId.startsWith(q)) return 2
  if (larvaId.includes(q)) return 3
  if (displayName.startsWith(q)) return 4
  if (displayName.includes(q)) return 5
  return 6
}

export function rankMemberSearchResults<T extends MemberSearchFields>(
  query: string,
  members: T[],
): T[] {
  return [...members].sort((a, b) => {
    const delta = memberSearchRank(query, a) - memberSearchRank(query, b)
    if (delta !== 0) return delta
    return a.displayName.localeCompare(b.displayName)
  })
}
