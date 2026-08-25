/**
 * Client-side cache of forum upvote state so the HUD can show prior votes
 * immediately on return visits, before the JWT-backed server hydrate lands.
 */

const STORAGE_KEY = 'moltology:forum-votes:v1'

type UserVoteMap = Record<string, boolean>
type VoteCacheStore = Record<string, UserVoteMap>

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function readStore(): VoteCacheStore {
  if (!canUseStorage()) return {}
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? (parsed as VoteCacheStore) : {}
  } catch {
    return {}
  }
}

function writeStore(store: VoteCacheStore): void {
  if (!canUseStorage()) return
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Ignore quota / private-mode failures
  }
}

/** Peek a cached vote for one target. `undefined` means no cached answer. */
export function peekForumVote(userId: string | null | undefined, targetId: string): boolean | undefined {
  if (!userId || !targetId) return undefined
  const entry = readStore()[userId]?.[targetId]
  return typeof entry === 'boolean' ? entry : undefined
}

/** Persist a single vote outcome for the current initiate. */
export function writeForumVote(
  userId: string | null | undefined,
  targetId: string,
  voted: boolean
): void {
  if (!userId || !targetId) return
  const store = readStore()
  const userMap: UserVoteMap = { ...(store[userId] || {}), [targetId]: voted }
  writeStore({ ...store, [userId]: userMap })
}

/**
 * Resolve display voted state:
 * - explicit server boolean wins
 * - otherwise fall back to session cache for instant paint
 */
export function resolveForumVoted(
  serverVoted: boolean | undefined,
  userId: string | null | undefined,
  targetId: string
): boolean {
  if (typeof serverVoted === 'boolean') return serverVoted
  return peekForumVote(userId, targetId) === true
}

/** Write server-hydrated vote flags into the cache (authoritative reconcile). */
export function syncForumVotesFromServer(
  userId: string | null | undefined,
  items: Array<{ id: string; voted?: boolean }>
): void {
  if (!userId || items.length === 0) return
  const store = readStore()
  const userMap: UserVoteMap = { ...(store[userId] || {}) }
  for (const item of items) {
    if (typeof item.voted === 'boolean') {
      userMap[item.id] = item.voted
    }
  }
  writeStore({ ...store, [userId]: userMap })
}
