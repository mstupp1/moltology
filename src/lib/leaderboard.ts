/**
 * Community leaderboard: members ranked by XP earned this week (Monday 00:00 UTC to the next
 * Monday) or in total. The top 3 of each finished week wear a crest for the following week,
 * and every top-3 finish counts toward a member's lasting record.
 *
 * Everything here is worked out from the XP ledger on read, so there is no award job and no
 * table to keep in step. Pure rules live here; reads live in server/leaderboard.ts.
 */

export type LeaderboardWindow = 'week' | 'all'
export type CrestRank = 1 | 2 | 3

/** Rows shown on the full page and in the forum rail card. */
export const LEADERBOARD_PAGE_SIZE = 25
export const LEADERBOARD_RAIL_SIZE = 5
/**
 * Ledger rows left out of the weekly ranking: one-off rows that would swamp a single week, and
 * arcade play (it has its own boards). They still count toward all time.
 */
export const LEADERBOARD_EXCLUDED_SOURCES = ['legacy_stage_migration', 'arcade'] as const

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS

export const CREST_TIERS: Record<CrestRank, { label: string; metal: string; color: string; ring: string; soft: string }> = {
  1: { label: 'Gold', metal: 'gold', color: '#f2c94c', ring: 'rgba(242,201,76,0.55)', soft: 'rgba(242,201,76,0.12)' },
  2: { label: 'Silver', metal: 'silver', color: '#c9d3dd', ring: 'rgba(201,211,221,0.5)', soft: 'rgba(201,211,221,0.1)' },
  3: { label: 'Bronze', metal: 'bronze', color: '#d08a52', ring: 'rgba(208,138,82,0.5)', soft: 'rgba(208,138,82,0.12)' },
}

export function isCrestRank(rank: number | null | undefined): rank is CrestRank {
  return rank === 1 || rank === 2 || rank === 3
}

/** Monday 00:00 UTC of the week holding `at`. */
export function weekStartUtc(at: Date): Date {
  const day = new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()))
  const sinceMonday = (day.getUTCDay() + 6) % 7
  return new Date(day.getTime() - sinceMonday * DAY_MS)
}

export function addWeeks(start: Date, weeks: number): Date {
  return new Date(start.getTime() + weeks * WEEK_MS)
}

/** The current week and the finished week whose top 3 wear crests now. */
export function leaderboardWeeks(now: Date) {
  const current = weekStartUtc(now)
  return {
    currentStart: current,
    currentEnd: addWeeks(current, 1),
    crestWeekStart: addWeeks(current, -1),
  }
}

export interface WeeklyTotal {
  userId: string
  weekStart: string
  xp: number
  /** Latest award that week; the earlier finisher wins a tie. */
  lastAt: string
}

/** Highest XP first; ties go to whoever got there first, then by id so order never flickers. */
export function compareTotals(a: Pick<WeeklyTotal, 'xp' | 'lastAt' | 'userId'>, b: Pick<WeeklyTotal, 'xp' | 'lastAt' | 'userId'>) {
  if (b.xp !== a.xp) return b.xp - a.xp
  const at = Date.parse(a.lastAt) - Date.parse(b.lastAt)
  if (at !== 0 && Number.isFinite(at)) return at
  return a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0
}

export interface CrestRecord {
  gold: number
  silver: number
  bronze: number
  /** Weeks finished in the top 3. */
  weeks: number
}

export interface WeekPlacing {
  userId: string
  weekStart: string
  rank: CrestRank
  xp: number
}

/** Top 3 of every week in `totals` (weeks with no positive XP place nobody). */
export function placeWeeks(totals: WeeklyTotal[]): WeekPlacing[] {
  const byWeek = new Map<string, WeeklyTotal[]>()
  for (const row of totals) {
    if (!(row.xp > 0)) continue
    const list = byWeek.get(row.weekStart)
    if (list) list.push(row)
    else byWeek.set(row.weekStart, [row])
  }
  const placings: WeekPlacing[] = []
  for (const [weekStart, rows] of byWeek) {
    rows.sort(compareTotals)
    rows.slice(0, 3).forEach((row, index) => {
      placings.push({ userId: row.userId, weekStart, rank: (index + 1) as CrestRank, xp: row.xp })
    })
  }
  return placings
}

export function emptyRecord(): CrestRecord {
  return { gold: 0, silver: 0, bronze: 0, weeks: 0 }
}

export function tallyRecords(placings: WeekPlacing[]): Record<string, CrestRecord> {
  const records: Record<string, CrestRecord> = {}
  for (const p of placings) {
    const record = (records[p.userId] ??= emptyRecord())
    record.weeks += 1
    if (p.rank === 1) record.gold += 1
    else if (p.rank === 2) record.silver += 1
    else record.bronze += 1
  }
  return records
}

/** "#1 last week" */
export function crestTitle(rank: CrestRank): string {
  return `#${rank} last week`
}

/** "Top 3 · 4 weeks" with the gold count when there is one: "Top 3 · 4 weeks · 2× #1". */
export function recordLabel(record: CrestRecord | null | undefined): string | null {
  if (!record || record.weeks <= 0) return null
  const weeks = `${record.weeks} ${record.weeks === 1 ? 'week' : 'weeks'}`
  return record.gold > 0 ? `Top 3 · ${weeks} · ${record.gold}× #1` : `Top 3 · ${weeks}`
}

export function formatXp(xp: number): string {
  return `${Math.max(0, Math.trunc(xp)).toLocaleString('en-US')} XP`
}

/** "Nov 16 – 22" style label for a week, always in UTC so server and browser agree. */
export function formatWeekRange(start: Date | string): string {
  const from = typeof start === 'string' ? new Date(start) : start
  const to = new Date(from.getTime() + 6 * DAY_MS)
  const month = (d: Date) => d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  const sameMonth = from.getUTCMonth() === to.getUTCMonth()
  return sameMonth
    ? `${month(from)} ${from.getUTCDate()} – ${to.getUTCDate()}`
    : `${month(from)} ${from.getUTCDate()} – ${month(to)} ${to.getUTCDate()}`
}
