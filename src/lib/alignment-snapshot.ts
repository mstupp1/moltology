/**
 * Last-known daily alignment snapshot for first paint.
 *
 * Completions live on the server. The HUD still needs a trustworthy count on
 * reload before that fetch returns — otherwise the header paints a fake 0/8.
 * Cache is local, date-scoped, and keyed by member id. No schema migrate.
 */

export const ALIGNMENT_SNAPSHOT_STORAGE_PREFIX = 'moltology:alignment:snapshot:'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface AlignmentSnapshot {
  date: string
  completedKeys: string[]
}

export function alignmentSnapshotStorageKey(userId: string): string {
  return `${ALIGNMENT_SNAPSHOT_STORAGE_PREFIX}${userId}`
}

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function isSnapshot(value: unknown): value is AlignmentSnapshot {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (typeof record.date !== 'string' || !DATE_RE.test(record.date)) return false
  if (!Array.isArray(record.completedKeys)) return false
  return record.completedKeys.every((key) => typeof key === 'string' && key.length > 0)
}

export function getCachedAlignmentSnapshot(
  userId: string | null | undefined,
): AlignmentSnapshot | null {
  if (!userId || !canUseLocalStorage()) return null
  try {
    const raw = window.localStorage.getItem(alignmentSnapshotStorageKey(userId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isSnapshot(parsed)) return null
    return {
      date: parsed.date,
      completedKeys: [...new Set(parsed.completedKeys)],
    }
  } catch {
    return null
  }
}

export function setCachedAlignmentSnapshot(
  userId: string | null | undefined,
  snapshot: AlignmentSnapshot,
): void {
  if (!userId || !canUseLocalStorage()) return
  if (!isSnapshot(snapshot)) return
  try {
    window.localStorage.setItem(
      alignmentSnapshotStorageKey(userId),
      JSON.stringify({
        date: snapshot.date,
        completedKeys: [...new Set(snapshot.completedKeys)],
      }),
    )
  } catch {
    // Ignore quota / privacy-mode write failures
  }
}

export function clearCachedAlignmentSnapshot(userId: string | null | undefined): void {
  if (!userId || !canUseLocalStorage()) return
  try {
    window.localStorage.removeItem(alignmentSnapshotStorageKey(userId))
  } catch {
    // Ignore storage access failures
  }
}

export function snapshotFromCompletedKeys(
  date: string,
  completedKeys: Iterable<string>,
): AlignmentSnapshot {
  return {
    date,
    completedKeys: [...new Set(completedKeys)],
  }
}

/**
 * Today's last-known snapshot for this member, or null when missing or stale.
 * Yesterday's count must not paint as today's progress.
 */
export function getFreshAlignmentSnapshot(
  userId: string | null | undefined,
  todayDate: string,
): AlignmentSnapshot | null {
  const snapshot = getCachedAlignmentSnapshot(userId)
  if (!snapshot || snapshot.date !== todayDate) return null
  return snapshot
}
