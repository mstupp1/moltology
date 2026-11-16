/**
 * Practice days: the weekdays a member practises daily alignment. Off days hide the
 * tasks and never break a streak. A schedule is a list of changes, each applying from
 * its `from` date, so past days keep the rule that applied when they happened.
 *
 * Days are stored as a 7-bit mask by JavaScript weekday: bit 0 = Sunday ... bit 6 = Saturday.
 */

/** Mon to Fri. */
export const DEFAULT_PRACTICE_DAYS = 0b0111110
export const ALL_PRACTICE_DAYS = 0b1111111
export const MIN_PRACTICE_DAYS = 4

/**
 * First date practice days apply to. Every earlier day was a practice day, so old
 * streaks are judged by the old rule. Starts on the launch weekend, so that weekend
 * already counts as off for everyone on the default.
 */
export const PRACTICE_DAYS_START = '2026-11-14'

export interface PracticeScheduleEntry {
  /** First date (YYYY-MM-DD) this set of days applies to. */
  from: string
  days: number
}

export type PracticeSchedule = PracticeScheduleEntry[]

/** Weekday names in mask order (Sunday first). */
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
/** Display order for pickers: Monday first. */
export const WEEKDAY_DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

/** JavaScript weekday (0 = Sunday) of a YYYY-MM-DD date, independent of the runtime's timezone. */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map((v) => parseInt(v, 10))
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).getUTCDay()
}

export function countPracticeDays(days: number): number {
  let count = 0
  for (let bit = 0; bit < 7; bit++) if (days & (1 << bit)) count++
  return count
}

export function isValidPracticeDays(days: unknown): days is number {
  return (
    typeof days === 'number' &&
    Number.isInteger(days) &&
    days >= 0 &&
    days <= ALL_PRACTICE_DAYS &&
    countPracticeDays(days) >= MIN_PRACTICE_DAYS
  )
}

/** Sorts a schedule oldest first and drops malformed entries. */
export function normalizeSchedule(schedule: PracticeSchedule | null | undefined): PracticeSchedule {
  if (!schedule) return []
  return schedule
    .filter((entry) => /^\d{4}-\d{2}-\d{2}$/.test(entry.from) && isValidPracticeDays(entry.days))
    .slice()
    .sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0))
}

/** The practice-day mask that applies on `date`. */
export function practiceDaysOn(date: string, schedule: PracticeSchedule = []): number {
  if (date < PRACTICE_DAYS_START) return ALL_PRACTICE_DAYS
  let days = DEFAULT_PRACTICE_DAYS
  for (const entry of schedule) {
    if (entry.from <= date) days = entry.days
    else break
  }
  return days
}

/** True when `date` is a practice day under the schedule (assumed sorted oldest first). */
export function isPracticeDay(date: string, schedule: PracticeSchedule = []): boolean {
  return (practiceDaysOn(date, schedule) & (1 << weekdayOf(date))) !== 0
}

/** Builds a date predicate for streak maths. */
export function practiceDayChecker(schedule: PracticeSchedule = []): (date: string) => boolean {
  const sorted = normalizeSchedule(schedule)
  return (date) => isPracticeDay(date, sorted)
}

/** Plain summary such as "Mon to Fri", "Every day" or "Mon, Wed, Thu, Fri, Sat". */
export function describePracticeDays(days: number): string {
  if ((days & ALL_PRACTICE_DAYS) === ALL_PRACTICE_DAYS) return 'Every day'
  const picked = WEEKDAY_DISPLAY_ORDER.filter((d) => days & (1 << d))
  // A single unbroken run in Monday-first order reads as a range.
  const positions = picked.map((d) => WEEKDAY_DISPLAY_ORDER.indexOf(d))
  const isRun = positions.length >= 3 && positions.every((p, i) => i === 0 || p === positions[i - 1] + 1)
  if (isRun) return `${WEEKDAY_SHORT[picked[0]]} to ${WEEKDAY_SHORT[picked[picked.length - 1]]}`
  return picked.map((d) => WEEKDAY_SHORT[d]).join(', ')
}
