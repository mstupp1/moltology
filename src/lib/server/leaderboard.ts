import { and, desc, eq, gt, inArray, lt, notInArray, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { profiles, xpTransactions } from '../../db/schema'
import {
  LEADERBOARD_EXCLUDED_SOURCES,
  LEADERBOARD_PAGE_SIZE,
  compareTotals,
  isCrestRank,
  leaderboardWeeks,
  placeWeeks,
  tallyRecords,
  type CrestRank,
  type CrestRecord,
  type LeaderboardWindow,
  type WeeklyTotal,
} from '../leaderboard'
import { resolveMemberPublicName } from '../member-handle'
import { parseLobsterAvatarConfig, type LobsterAvatarConfig } from '../lobster-avatar'

type Db = ReturnType<typeof getDb>

export interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  handle: string | null
  stage: number
  xp: number
  avatarConfig: LobsterAvatarConfig | null
  /** Crest worn this week from last week's finish. */
  crest: CrestRank | null
}

export interface CrestHolder {
  userId: string
  rank: CrestRank
  xp: number
}

export interface RankHonors {
  /** Monday the crest week started (the finished week the holders placed in). */
  crestWeekStart: string
  holders: CrestHolder[]
  /** Lasting top-3 record for every member who has placed. */
  records: Record<string, CrestRecord>
}

export interface LeaderboardView extends RankHonors {
  window: LeaderboardWindow
  /** Stage filter, or null for everyone. */
  stage: number | null
  offset: number
  /** Ranked members in this view (after the stage filter). */
  total: number
  hasMore: boolean
  weekStart: string
  weekEnd: string
  entries: LeaderboardEntry[]
  /** Crest holders with names and portraits for the podium. */
  podium: LeaderboardEntry[]
  /** The viewer's own row when they are ranked below the list. */
  viewer: LeaderboardEntry | null
}

/** Public render data only: the same visual fields the forum shows. */
const publicAvatarConfig = sql<LobsterAvatarConfig | null>`CASE WHEN ${profiles.avatarConfig} IS NULL THEN NULL ELSE (${profiles.avatarConfig} - 'accessory' - 'claws' - 'equipment') || jsonb_build_object('equipment', CASE WHEN ${profiles.equipmentVersion} = 1 THEN ${profiles.equippedAppearance} ELSE '{}'::jsonb END) END`

const weekColumn = sql<string>`to_char(date_trunc('week', ${xpTransactions.createdAt}), 'YYYY-MM-DD"T"00:00:00.000"Z"')`

/** XP per member per week for every week before `before`. */
async function weeklyTotals(db: Db, before: Date): Promise<WeeklyTotal[]> {
  const rows = await db
    .select({
      userId: xpTransactions.userId,
      weekStart: weekColumn,
      xp: sql<number>`COALESCE(SUM(${xpTransactions.amount}), 0)::int`,
      lastAt: sql<string>`to_char(MAX(${xpTransactions.createdAt}), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`,
    })
    .from(xpTransactions)
    .where(
      and(
        notInArray(xpTransactions.source, [...LEADERBOARD_EXCLUDED_SOURCES]),
        lt(xpTransactions.createdAt, before),
      ),
    )
    .groupBy(xpTransactions.userId, weekColumn)

  return rows.map((r) => ({
    userId: r.userId,
    weekStart: r.weekStart,
    xp: Number(r.xp) || 0,
    lastAt: r.lastAt || new Date(0).toISOString(),
  }))
}

function honorsFrom(totals: WeeklyTotal[], now: Date): RankHonors {
  const { currentStart, crestWeekStart } = leaderboardWeeks(now)
  const finishedAt = currentStart.toISOString()
  const placings = placeWeeks(totals.filter((t) => t.weekStart < finishedAt))
  const crestKey = crestWeekStart.toISOString()
  return {
    crestWeekStart: crestKey,
    holders: placings
      .filter((p) => p.weekStart === crestKey)
      .sort((a, b) => a.rank - b.rank)
      .map(({ userId, rank, xp }) => ({ userId, rank, xp })),
    records: tallyRecords(placings),
  }
}

/** Who wears a crest this week, and everyone's lasting record. */
export async function getRankHonors(options: { db?: Db; now?: Date } = {}): Promise<RankHonors> {
  const now = options.now ?? new Date()
  const db = options.db ?? getDb()
  const { currentStart } = leaderboardWeeks(now)
  try {
    return honorsFrom(await weeklyTotals(db, currentStart), now)
  } catch (err) {
    console.warn('[leaderboard] honors read failed:', err)
    return { crestWeekStart: leaderboardWeeks(now).crestWeekStart.toISOString(), holders: [], records: {} }
  }
}

async function loadMembers(db: Db, ids: string[]) {
  if (ids.length === 0) return new Map<string, { name: string; handle: string | null; stage: number; xp: number; avatarConfig: LobsterAvatarConfig | null }>()
  const rows = await db
    .select({
      id: profiles.id,
      handle: profiles.handle,
      larvaId: profiles.larvaId,
      stage: profiles.stage,
      xp: profiles.xp,
      avatarConfig: publicAvatarConfig,
    })
    .from(profiles)
    .where(inArray(profiles.id, ids))
  return new Map(
    rows.map((r) => [
      r.id,
      {
        name: resolveMemberPublicName({ userId: r.id, handle: r.handle, larvaId: r.larvaId }),
        handle: r.handle ?? null,
        stage: r.stage ?? 1,
        xp: r.xp ?? 0,
        avatarConfig: r.avatarConfig ? parseLobsterAvatarConfig(r.avatarConfig) : null,
      },
    ]),
  )
}

export async function getLeaderboard(input: {
  window: LeaderboardWindow
  viewerId?: string | null
  limit?: number
  offset?: number
  /** Only members at this stage; ranks are counted within the filtered list. */
  stage?: number | null
  db?: Db
  now?: Date
}): Promise<LeaderboardView> {
  const now = input.now ?? new Date()
  const db = input.db ?? getDb()
  const limit = Math.max(1, Math.min(LEADERBOARD_PAGE_SIZE, Math.trunc(input.limit ?? LEADERBOARD_PAGE_SIZE)))
  const offset = Math.max(0, Math.trunc(input.offset ?? 0))
  const stage = input.stage && input.stage >= 1 && input.stage <= 4 ? Math.trunc(input.stage) : null
  const { currentStart, currentEnd } = leaderboardWeeks(now)
  const base = {
    window: input.window,
    stage,
    offset,
    weekStart: currentStart.toISOString(),
    weekEnd: currentEnd.toISOString(),
  }

  try {
    const totals = await weeklyTotals(db, currentEnd)
    const honors = honorsFrom(totals, now)
    const crestOf = new Map(honors.holders.map((h) => [h.userId, h.rank]))

    // Ranked ids with their score, best first.
    let ranked: { userId: string; xp: number }[]
    if (input.window === 'week') {
      const thisWeek = currentStart.toISOString()
      ranked = totals
        .filter((t) => t.weekStart === thisWeek && t.xp > 0)
        .sort(compareTotals)
        .map((t) => ({ userId: t.userId, xp: t.xp }))
      if (stage !== null && ranked.length > 0) {
        const rows = await db
          .select({ id: profiles.id })
          .from(profiles)
          .where(and(inArray(profiles.id, ranked.map((r) => r.userId)), eq(profiles.stage, stage)))
        const keep = new Set(rows.map((r) => r.id))
        ranked = ranked.filter((r) => keep.has(r.userId))
      }
    } else {
      const rows = await db
        .select({ userId: profiles.id, xp: profiles.xp })
        .from(profiles)
        .where(and(gt(profiles.xp, 0), stage !== null ? eq(profiles.stage, stage) : undefined))
        .orderBy(desc(profiles.xp), profiles.createdAt, profiles.id)
      ranked = rows.map((r) => ({ userId: r.userId, xp: r.xp }))
    }

    const page = ranked.slice(offset, offset + limit)
    const hasMore = ranked.length > offset + limit
    const viewerIndex = input.viewerId ? ranked.findIndex((r) => r.userId === input.viewerId) : -1
    // The viewer's own row, when it sits below everything loaded so far.
    const viewerBelow = viewerIndex >= offset + limit ? ranked[viewerIndex] : null

    const ids = new Set<string>([...page.map((r) => r.userId), ...(offset === 0 ? honors.holders.map((h) => h.userId) : [])])
    if (viewerBelow) ids.add(viewerBelow.userId)
    const members = await loadMembers(db, [...ids])

    const toEntry = (userId: string, xp: number, rank: number): LeaderboardEntry | null => {
      const m = members.get(userId)
      if (!m) return null
      const crest = crestOf.get(userId) ?? null
      return { rank, userId, name: m.name, handle: m.handle, stage: m.stage, xp, avatarConfig: m.avatarConfig, crest: isCrestRank(crest) ? crest : null }
    }

    const entries = page
      .map((r, i) => toEntry(r.userId, r.xp, offset + i + 1))
      .filter((e): e is LeaderboardEntry => e !== null)
    const podium =
      offset === 0
        ? honors.holders.map((h) => toEntry(h.userId, h.xp, h.rank)).filter((e): e is LeaderboardEntry => e !== null)
        : []
    const viewer = viewerBelow ? toEntry(viewerBelow.userId, viewerBelow.xp, viewerIndex + 1) : null

    return { ...base, ...honors, total: ranked.length, hasMore, entries, podium, viewer }
  } catch (err) {
    console.warn('[leaderboard] read failed:', err)
    return { ...base, crestWeekStart: leaderboardWeeks(now).crestWeekStart.toISOString(), holders: [], records: {}, total: 0, hasMore: false, entries: [], podium: [], viewer: null }
  }
}
