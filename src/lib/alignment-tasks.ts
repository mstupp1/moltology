/** Visible routine history and maximum per-day retention horizon. */
export const ALIGNMENT_HISTORY_DAYS = 90

/** Where a task's practice is described in the Codex. */
export interface AlignmentCodexRef {
  /** Scripture slug, such as scr-030. */
  slug: string
  /** Verse to open at; omit to open the scripture at the top. */
  verse?: number
  /** The Codex's name for this practice, shown on the link. */
  label: string
}

export interface CanonicalAlignmentTask {
  key: string
  time: string
  title: string
  description?: string
  codex?: AlignmentCodexRef
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
  /** Not a practice day under the member's schedule: a miss here does not break the streak. */
  offDay?: boolean
}

/** Anchor for the Daily alignment schedule. */
export const DAILY_ALIGNMENT_HUB_ID = 'daily-routine-hub'

// Titles are plain actions. The order follows the Codex scripture "The Daily Shedding
// Routine" (SCR-030), and `codex` points at the verse or scripture behind each task.
// Keys are stored with completions and streaks, so never change them when renaming.
export const CANONICAL_ALIGNMENT_TASKS: CanonicalAlignmentTask[] = [
  {
    key: 'silent-synchronization',
    time: 'Early morning',
    title: 'Sit in silence',
    description: 'Before any feed or inbox, sit quietly and look honestly at yesterday.',
    codex: { slug: 'scr-030', verse: 2, label: 'Silent Synchronization' },
  },
  {
    key: 'prompt-construction',
    time: 'Morning',
    title: 'Pick your one thing',
    description: 'Name the one thing that matters most today and start on it.',
    codex: { slug: 'scr-030', verse: 3, label: 'The Grip' },
  },
  {
    key: 'skill-development',
    time: 'Late morning',
    title: 'Learn something hard',
    description: 'Learn one difficult thing on purpose.',
    codex: { slug: 'scr-030', verse: 4, label: 'Carapace Hardening' },
  },
  {
    key: 'nutritional-efficiency-break',
    time: 'Noon',
    title: 'Reset your focus',
    description: 'Clear one distraction and choose the next useful action.',
    codex: { slug: 'scr-030', verse: 5, label: 'Low Tide' },
  },
  {
    key: 'iterative-refinement',
    time: 'Afternoon',
    title: 'Do deep work',
    description: 'Shut out interruptions and work on one thing.',
    codex: { slug: 'scr-031', label: 'Isolation Protocols' },
  },
  {
    key: 'community-outreach',
    time: 'Late afternoon',
    title: 'Help a member',
    description: 'Answer one member or welcome a newcomer.',
    codex: { slug: 'scr-030', verse: 7, label: 'The Benthic Pod' },
  },
  {
    key: 'reflection-log',
    time: 'Early evening',
    title: 'Let one thing go',
    description: 'Name one thing from today and let it go.',
    codex: { slug: 'scr-032', label: 'Nightly Molt Audit' },
  },
  {
    key: 'alignment-review',
    time: 'Evening',
    title: 'Close the day',
    description: 'Check off the day and stop. It is done either way.',
    codex: { slug: 'scr-030', verse: 9, label: 'Carapace Close' },
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

/** Every day is a practice day: the rule before practice days existed. */
const EVERY_DAY = () => true

/**
 * Walks back from today through the history. Full days add one. A missed practice day
 * ends the streak; a missed off day is skipped. Today never breaks the streak, because it
 * is not over yet. `reachedStart` is true when the walk passed the oldest history date
 * without a break, so an older compacted carry may continue the run.
 */
function walkStreak(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  totalTasks: number,
  isPracticeDay: (date: string) => boolean,
): { streak: number; reachedStart: boolean } {
  const countMap = new Map<string, number>()
  let oldestDate = todayDate
  for (const item of history) {
    countMap.set(item.date, item.completedCount)
    if (item.date < oldestDate) oldestDate = item.date
  }

  let streak = (countMap.get(todayDate) ?? 0) >= totalTasks ? 1 : 0
  let currentDate = shiftDays(todayDate, -1)
  while (currentDate >= oldestDate) {
    const full = (countMap.get(currentDate) ?? 0) >= totalTasks
    if (full) streak++
    else if (isPracticeDay(currentDate)) return { streak, reachedStart: false }
    currentDate = shiftDays(currentDate, -1)
  }
  return { streak, reachedStart: true }
}

/**
 * Computes the streak ending today or yesterday: full-completion days, skipping off days
 * that were missed. A full off day still counts as a bonus day.
 */
export function computeStreak(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  totalTasks: number = TOTAL_ALIGNMENT_TASKS,
  isPracticeDay: (date: string) => boolean = EVERY_DAY
): number {
  return walkStreak(history, todayDate, totalTasks, isPracticeDay).streak
}

/**
 * Computes the visible streak and joins a compacted carry when the run reaches the day
 * immediately after the carry anchor without a break.
 */
export function computeStreakWithCarry(
  history: Array<{ date: string; completedCount: number }>,
  todayDate: string,
  carry?: { anchorDate: string; streakDays: number } | null,
  totalTasks: number = TOTAL_ALIGNMENT_TASKS,
  isPracticeDay: (date: string) => boolean = EVERY_DAY
): number {
  const { streak, reachedStart } = walkStreak(history, todayDate, totalTasks, isPracticeDay)
  if (!carry || history.length === 0 || !reachedStart) return streak

  const oldestDate = history.reduce((min, item) => (item.date < min ? item.date : min), history[0].date)
  if (shiftDays(oldestDate, -1) === carry.anchorDate) {
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
  totalTasks = TOTAL_ALIGNMENT_TASKS,
  isPracticeDay: (date: string) => boolean = EVERY_DAY
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
      offDay: !isPracticeDay(dStr),
    })
  }
  return result
}

/** DOM id of a verse in the Codex reader, used as the link hash. Lives with the other Codex links. */
export { codexVerseAnchor } from './codex-links'

/** The Codex reference for a task key, looked up from the catalog so server payloads stay small. */
export function alignmentTaskCodex(key: string | undefined): AlignmentCodexRef | undefined {
  if (!key) return undefined
  return CANONICAL_ALIGNMENT_TASKS.find((task) => task.key === key)?.codex
}
