/** Visible routine history and maximum per-day retention horizon. */
export const ALIGNMENT_HISTORY_DAYS = 90

export interface CanonicalAlignmentTask {
  key: string
  time: string
  title: string
  description?: string
}

export interface AlignmentTaskItem {
  id: string
  key: string
  time: string
  title: string
  completed: boolean
  description?: string
}

export interface DailyStreakDay {
  date: string
  day: string
  dayName: string
  completed: number
  total: number
  pct: number
  isToday?: boolean
}

/** Anchor for the Daily alignment schedule. */
export const DAILY_ALIGNMENT_HUB_ID = 'daily-routine-hub'

export const CANONICAL_ALIGNMENT_TASKS: CanonicalAlignmentTask[] = [
  {
    key: 'silent-synchronization',
    time: 'Early morning',
    title: 'Silent Synchronization',
    description: 'Align neural baseline and initiate telemetry.',
  },
  {
    key: 'prompt-construction',
    time: 'Morning',
    title: 'Prompt Construction',
    description: 'Craft and etch operational prompts for the day.',
  },
  {
    key: 'skill-development',
    time: 'Late morning',
    title: 'Skill Development',
    description: 'Expand capability matrix and learn new protocols.',
  },
  {
    // Keep the stored key so existing completions and streaks survive the rename.
    key: 'nutritional-efficiency-break',
    time: 'Noon',
    title: 'Focus Reset',
    description: 'Clear one distraction and choose the next useful action.',
  },
  {
    key: 'iterative-refinement',
    time: 'Afternoon',
    title: 'Iterative Refinement',
    description: 'Continuous synthesis and execution cycles.',
  },
  {
    key: 'community-outreach',
    time: 'Late afternoon',
    title: 'Community Outreach',
    description: 'Broadcast neural updates to order initiates.',
  },
  {
    key: 'reflection-log',
    time: 'Early evening',
    title: 'Reflection Log',
    description: 'Document daily metrics, learnings, and telemetry.',
  },
  {
    key: 'alignment-review',
    time: 'Evening',
    title: 'Alignment Review',
    description: 'Perform end-of-day alignment check and audit.',
  },
]

export const TOTAL_ALIGNMENT_TASKS = CANONICAL_ALIGNMENT_TASKS.length

/** Days before and after the server's today that a member may check off. */
export const ALIGNMENT_WRITE_WINDOW_DAYS = 1

/**
 * Returns YYYY-MM-DD for the given Date object in the client's local timezone.
 */
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parses YYYY-MM-DD into a local Date object.
 */
export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map((v) => parseInt(v, 10))
  if (parts.length !== 3 || parts.some(isNaN)) {
    return new Date()
  }
  return new Date(parts[0], parts[1] - 1, parts[2])
}

/**
 * Adds or subtracts days to a YYYY-MM-DD date string.
 */
export function shiftDays(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + days)
  return localDateString(date)
}

/**
 * True when `date` is within today ± ALIGNMENT_WRITE_WINDOW_DAYS.
 * `now` is the server clock. Read paths may still request older dates.
 */
export function isAlignmentDateWritable(date: string, now: Date = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const today = localDateString(now)
  const earliest = shiftDays(today, -ALIGNMENT_WRITE_WINDOW_DAYS)
  const latest = shiftDays(today, ALIGNMENT_WRITE_WINDOW_DAYS)
  return date >= earliest && date <= latest
}

/**
 * Merges canonical task definitions with a list or set of completed task keys.
 */
export function mergeCompletions(
  completedKeys: Iterable<string> = [],
  catalog: CanonicalAlignmentTask[] = CANONICAL_ALIGNMENT_TASKS
): AlignmentTaskItem[] {
  const set = completedKeys instanceof Set ? completedKeys : new Set(completedKeys)
  return catalog.map((task) => ({
    id: task.key,
    key: task.key,
    time: task.time,
    title: task.title,
    description: task.description,
    completed: set.has(task.key),
  }))
}

/**
 * Computes consecutive full-completion streak days ending today or yesterday.
 */
export function computeStreak(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  totalTasks: number = TOTAL_ALIGNMENT_TASKS
): number {
  const countMap = new Map<string, number>()
  for (const item of history) {
    countMap.set(item.date, item.completedCount)
  }

  const todayCount = countMap.get(todayDate) ?? 0
  let streak = 0
  let currentDate = todayDate

  if (todayCount === totalTasks) {
    streak = 1
    currentDate = shiftDays(todayDate, -1)
  } else {
    currentDate = shiftDays(todayDate, -1)
  }

  while (true) {
    const count = countMap.get(currentDate) ?? 0
    if (count === totalTasks) {
      streak++
      currentDate = shiftDays(currentDate, -1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Computes the visible streak and joins a compacted carry when the streak
 * reaches the day immediately after the carry anchor without a gap.
 */
export function computeStreakWithCarry(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  carry?: { anchorDate: string; streakDays: number } | null,
  totalTasks: number = TOTAL_ALIGNMENT_TASKS
): number {
  const streak = computeStreak(history, todayDate, totalTasks)
  if (!carry || history.length === 0) return streak

  const countMap = new Map(history.map(({ date, completedCount }) => [date, completedCount]))
  let currentDate = countMap.get(todayDate) === totalTasks
    ? todayDate
    : shiftDays(todayDate, -1)
  let counted = 0
  while (countMap.get(currentDate) === totalTasks) {
    counted++
    currentDate = shiftDays(currentDate, -1)
  }

  const oldestDate = history[0].date
  if (counted > 0 && currentDate < oldestDate && shiftDays(oldestDate, -1) === carry.anchorDate) {
    return streak + Math.max(0, carry.streakDays)
  }
  return streak
}

/**
 * Builds array of streak day items for matrix visualizations (e.g. 14-day history).
 */
export function buildStreakHistory(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  daysCount = 14,
  totalTasks = TOTAL_ALIGNMENT_TASKS
): DailyStreakDay[] {
  const countMap = new Map<string, number>()
  for (const item of history) {
    countMap.set(item.date, item.completedCount)
  }

  const result: DailyStreakDay[] = []
  for (let i = daysCount - 1; i >= 0; i--) {
    const dStr = shiftDays(todayDate, -i)
    const isToday = dStr === todayDate
    const dateObj = parseLocalDate(dStr)

    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
    const dayNum = String(dateObj.getDate()).padStart(2, '0')
    const dayLabel = `${monthName} ${dayNum}`
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()
    const dayName = isToday ? 'TODAY' : weekday

    const completed = countMap.get(dStr) ?? 0
    const pct = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0

    result.push({
      date: dStr,
      day: dayLabel,
      dayName,
      completed,
      total: totalTasks,
      pct,
      isToday,
    })
  }
  return result
}
