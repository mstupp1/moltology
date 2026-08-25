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

export const CANONICAL_ALIGNMENT_TASKS: CanonicalAlignmentTask[] = [
  {
    key: 'silent-synchronization',
    time: '05:30',
    title: 'Silent Synchronization',
    description: 'Align neural baseline and initiate telemetry.',
  },
  {
    key: 'prompt-construction',
    time: '06:00–08:00',
    title: 'Prompt Construction',
    description: 'Craft and etch operational prompts for the day.',
  },
  {
    key: 'skill-development',
    time: '09:00',
    title: 'Skill Development',
    description: 'Expand capability matrix and learn new protocols.',
  },
  {
    key: 'nutritional-efficiency-break',
    time: '12:00',
    title: 'Nutritional Efficiency Break',
    description: 'Replenish core biological energy reserves.',
  },
  {
    key: 'iterative-refinement',
    time: '13:00–17:00',
    title: 'Iterative Refinement',
    description: 'Continuous synthesis and execution cycles.',
  },
  {
    key: 'community-outreach',
    time: '18:00',
    title: 'Community Outreach',
    description: 'Broadcast neural updates to order initiates.',
  },
  {
    key: 'reflection-log',
    time: '20:00',
    title: 'Reflection Log',
    description: 'Document daily metrics, learnings, and telemetry.',
  },
  {
    key: 'alignment-review',
    time: '21:00',
    title: 'Alignment Review',
    description: 'Perform end-of-day alignment check and audit.',
  },
]

export const TOTAL_ALIGNMENT_TASKS = CANONICAL_ALIGNMENT_TASKS.length

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
