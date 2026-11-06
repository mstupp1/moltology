/**
 * Shared page sizes and helpers for lists that grow with real use.
 *
 * Two shapes are used:
 * - Offset pages (`offset` + `limit`) for lists ranked by something other than
 *   time (forum "top"/"hot", pinned Oracle threads, admin tables).
 * - Row cursors (`before` = the id of the last row shown) for time-ordered
 *   streams where new rows arrive at the head (Oracle messages, blog comments).
 *   The server compares against that row's own timestamp, so there is no
 *   precision loss from round-tripping dates through JSON.
 */

export const PAGE_SIZES = {
  forumReplies: 30,
  forumTopics: 30,
  friends: 30,
  oracleThreads: 30,
  oracleMessages: 50,
  blogComments: 20,
  blogPosts: 12,
  adminRows: 50,
} as const

/** Largest page any list accepts, so a client cannot ask for everything at once. */
export const MAX_PAGE_SIZE = 100

export function clampPageSize(limit: number | null | undefined, fallback: number): number {
  const n = typeof limit === 'number' && Number.isFinite(limit) ? Math.floor(limit) : fallback
  return Math.min(Math.max(n, 1), MAX_PAGE_SIZE)
}

export function clampOffset(offset: number | null | undefined): number {
  const n = typeof offset === 'number' && Number.isFinite(offset) ? Math.floor(offset) : 0
  return Math.max(n, 0)
}

/**
 * Callers fetch `limit + 1` rows; this trims the extra row and reports whether
 * another page exists.
 */
export function takePage<T>(rows: T[], limit: number): { items: T[]; hasMore: boolean } {
  const hasMore = rows.length > limit
  return { items: hasMore ? rows.slice(0, limit) : rows, hasMore }
}

/** Next offset after a page, or null when the list is exhausted. */
export function nextOffsetFor(offset: number, pageLength: number, hasMore: boolean): number | null {
  return hasMore ? offset + pageLength : null
}

/** Appends a page to what is already shown, keeping the first copy of any id. */
export function mergeById<T extends { id: string }>(current: T[], incoming: T[]): T[] {
  if (incoming.length === 0) return current
  const seen = new Set(current.map((row) => row.id))
  const merged = [...current]
  for (const row of incoming) {
    if (seen.has(row.id)) continue
    seen.add(row.id)
    merged.push(row)
  }
  return merged
}
