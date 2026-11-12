import { QueryClient, dehydrate, hydrate, type Query } from '@tanstack/react-query'

/**
 * One TanStack Query client per browser tab (and a fresh one per server render).
 *
 * Account queries (`meta: { persist: true }`) are saved to localStorage, so a
 * returning member paints their real avatar, stage and balances on the first
 * client frame and the network read only refreshes them. Query keys always carry
 * the member id, so one account never sees another's cached data.
 */

export const QUERY_CACHE_STORAGE_KEY = 'moltology:query-cache:v1'
/** Bump with any breaking change to a persisted query's data shape. */
const QUERY_CACHE_BUSTER = '1'
/** Drop a saved cache older than this; the member will see loading placeholders instead. */
export const QUERY_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000
const PERSIST_THROTTLE_MS = 1_000

type PersistedCache = {
  buster: string
  savedAt: number
  state: ReturnType<typeof dehydrate>
}

let browserClient: QueryClient | null = null

function createClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Account data changes through this app, which invalidates what it changes.
        staleTime: 60_000,
        // Keep persisted entries in memory long enough to be written back.
        gcTime: QUERY_CACHE_MAX_AGE_MS,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

function shouldPersist(query: Query): boolean {
  return query.meta?.persist === true && query.state.status === 'success'
}

function readPersisted(): PersistedCache | null {
  try {
    const raw = window.localStorage.getItem(QUERY_CACHE_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedCache
    if (!parsed || parsed.buster !== QUERY_CACHE_BUSTER) return null
    if (typeof parsed.savedAt !== 'number' || Date.now() - parsed.savedAt > QUERY_CACHE_MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writePersisted(client: QueryClient): void {
  try {
    const state = dehydrate(client, { shouldDehydrateQuery: shouldPersist })
    const record: PersistedCache = { buster: QUERY_CACHE_BUSTER, savedAt: Date.now(), state }
    window.localStorage.setItem(QUERY_CACHE_STORAGE_KEY, JSON.stringify(record))
  } catch {
    // Private mode or a full quota: the app still works, it just loads fresh.
  }
}

function attachPersistence(client: QueryClient): void {
  const saved = readPersisted()
  if (saved) {
    try {
      hydrate(client, saved.state)
    } catch {
      // A corrupt cache is only a missed head start.
    }
  }

  let timer: ReturnType<typeof setTimeout> | null = null
  client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' && event.type !== 'removed') return
    if (event.query.meta?.persist !== true) return
    if (timer) return
    timer = setTimeout(() => {
      timer = null
      writePersisted(client)
    }, PERSIST_THROTTLE_MS)
  })
}

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') return createClient()
  if (!browserClient) {
    browserClient = createClient()
    attachPersistence(browserClient)
  }
  return browserClient
}

/** Forget every member-scoped query, in memory and on disk (sign-out). */
export function clearAccountQueryCache(): void {
  if (typeof window === 'undefined') return
  browserClient?.removeQueries({ queryKey: ['account'] })
  try {
    window.localStorage.removeItem(QUERY_CACHE_STORAGE_KEY)
  } catch {
    // ignore
  }
}

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { persist?: boolean }
  }
}
