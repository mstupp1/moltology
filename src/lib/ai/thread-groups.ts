export type ThreadDateGroupId = 'today' | 'yesterday' | 'week' | 'older'

export const THREAD_DATE_GROUP_LABELS: Record<ThreadDateGroupId, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'Previous 7 days',
  older: 'Older',
}

const GROUP_ORDER: ThreadDateGroupId[] = ['today', 'yesterday', 'week', 'older']

interface DatedThread {
  updatedAt?: string | Date | null
  createdAt?: string | Date | null
}

const toMs = (value?: string | Date | null) => {
  if (!value) return NaN
  return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

const startOfLocalDay = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

export function threadDateGroup(thread: DatedThread, nowMs: number): ThreadDateGroupId {
  const ms = toMs(thread.updatedAt || thread.createdAt)
  if (!Number.isFinite(ms)) return 'older'
  const today = startOfLocalDay(nowMs)
  const dayMs = 24 * 60 * 60 * 1000
  if (ms >= today) return 'today'
  if (ms >= today - dayMs) return 'yesterday'
  if (ms >= today - 7 * dayMs) return 'week'
  return 'older'
}

/** Splits threads (already sorted newest first) into date sections, keeping their order. */
export function groupThreadsByDate<T extends DatedThread>(
  threads: T[],
  nowMs: number
): Array<{ id: ThreadDateGroupId; label: string; threads: T[] }> {
  const buckets = new Map<ThreadDateGroupId, T[]>()
  for (const t of threads) {
    const id = threadDateGroup(t, nowMs)
    const list = buckets.get(id) ?? []
    list.push(t)
    buckets.set(id, list)
  }
  return GROUP_ORDER.filter((id) => buckets.has(id)).map((id) => ({
    id,
    label: THREAD_DATE_GROUP_LABELS[id],
    threads: buckets.get(id)!,
  }))
}

/** Case-insensitive title match for the chat search box. */
export function filterThreadsByQuery<T extends { title?: string | null }>(threads: T[], query: string): T[] {
  const q = query.trim().toLowerCase()
  if (!q) return threads
  return threads.filter((t) => (t.title || '').toLowerCase().includes(q))
}
