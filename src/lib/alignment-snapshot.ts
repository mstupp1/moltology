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

/**
 * Last-known XP and streak for first paint, so the dashboard and XP ring open on the
 * member's real stage instead of Stage 1 / 0 XP while the server read is in flight.
 * XP never resets, so it is used at any age; the streak only when saved today.
 */
export const PROGRESS_SNAPSHOT_STORAGE_PREFIX = 'moltology:alignment:progress:'

export interface ProgressSnapshot {
  /** Local date the streak values were read for. */
  date: string
  xp: number
  stage: number
  streakDays: number
  todayWasComplete: boolean
  history: Array<{ date: string; completedCount: number }>
}

export function progressSnapshotStorageKey(userId: string): string {
  return `${PROGRESS_SNAPSHOT_STORAGE_PREFIX}${userId}`
}

function isProgressSnapshot(value: unknown): value is ProgressSnapshot {
  if (!value || typeof value !== 'object') return false
  const r = value as Record<string, unknown>
  return (
    typeof r.date === 'string' &&
    DATE_RE.test(r.date) &&
    typeof r.xp === 'number' &&
    Number.isFinite(r.xp) &&
    typeof r.stage === 'number' &&
    typeof r.streakDays === 'number' &&
    typeof r.todayWasComplete === 'boolean' &&
    Array.isArray(r.history) &&
    r.history.every(
      (day) =>
        !!day &&
        typeof (day as { date?: unknown }).date === 'string' &&
        typeof (day as { completedCount?: unknown }).completedCount === 'number',
    )
  )
}

export function getCachedProgressSnapshot(userId: string | null | undefined): ProgressSnapshot | null {
  if (!userId || !canUseLocalStorage()) return null
  try {
    const raw = window.localStorage.getItem(progressSnapshotStorageKey(userId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isProgressSnapshot(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function setCachedProgressSnapshot(userId: string | null | undefined, snapshot: ProgressSnapshot): void {
  if (!userId || !canUseLocalStorage() || !isProgressSnapshot(snapshot)) return
  try {
    // The streak strip only shows two weeks; keep the record small.
    const history = snapshot.history.slice(-21)
    window.localStorage.setItem(progressSnapshotStorageKey(userId), JSON.stringify({ ...snapshot, history }))
  } catch {
    // Ignore quota / privacy-mode write failures
  }
}
