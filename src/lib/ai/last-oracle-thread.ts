export type OracleThreadLike = {
  id: string
  title?: string | null
  updatedAt?: string | Date | null
  createdAt?: string | Date | null
  archivedAt?: string | Date | null
}

export type OracleThreadSearch = {
  thread?: string
}

export function threadTimestampMs(value?: string | Date | null): number {
  if (!value) return 0
  const ms = value instanceof Date ? value.getTime() : Date.parse(String(value))
  return Number.isFinite(ms) ? ms : 0
}

/**
 * Most recently updated non-archived thread.
 * Pin order is ignored so a pinned older session cannot hide the last consultation.
 */
export function pickLastActiveOracleThread<T extends OracleThreadLike>(
  threads: T[] | null | undefined,
): T | null {
  if (!threads?.length) return null

  let last: T | null = null
  let lastMs = -1

  for (const thread of threads) {
    if (!thread?.id || thread.archivedAt) continue
    const ms = Math.max(threadTimestampMs(thread.updatedAt), threadTimestampMs(thread.createdAt))
    if (!last || ms > lastMs) {
      last = thread
      lastMs = ms
    }
  }

  return last
}

export function parseOracleThreadSearch(
  search: Record<string, unknown> | undefined | null,
): string | undefined {
  const thread = search?.thread
  if (typeof thread !== 'string') return undefined
  const trimmed = thread.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export function validateOracleSearch(search: Record<string, unknown>): OracleThreadSearch {
  const thread = parseOracleThreadSearch(search)
  return thread ? { thread } : {}
}

export function oracleRouteSearch(threadId?: string | null): OracleThreadSearch {
  return threadId ? { thread: threadId } : {}
}
