/**
 * Arcade reads and writes: starting and finishing runs, the XP a run earns, each game's weekly and
 * all-time boards, and the weekly gem prizes (paid on the first board read after a week ends, so
 * there is no job to schedule). Rules and numbers live in ../arcade.ts.
 */
import { and, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { arcadeRuns, profiles, xpTransactions } from '../../db/schema'
import {
  ARCADE_BOARD_SIZE,
  ARCADE_GAMES,
  ARCADE_RUN_MAX_MS,
  ARCADE_RUNS_PER_HOUR,
  ARCADE_XP_PER_RUN,
  ARCADE_XP_RUNS_PER_DAY,
  arcadeDay,
  arcadeRunEarnsXp,
  arcadeWeeklyGems,
  isPlausibleScore,
  type ArcadeBoardWindow,
  type ArcadeGameId,
} from '../arcade'
import { addWeeks, weekStartUtc } from '../leaderboard'
import { resolveMemberPublicName } from '../member-handle'
import { parseLobsterAvatarConfig, type LobsterAvatarConfig } from '../lobster-avatar'
import { awardGems } from './gems'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

export interface ArcadeRunTicket {
  /** Null when the run will not be recorded (too many runs this hour); the game still plays. */
  runId: string | null
  seed: number
}

export interface ArcadeRunResult {
  saved: boolean
  score: number
  /** Best score before this run, all time. */
  previousBest: number
  isBest: boolean
  xp: number
  /** Rewarded runs left today after this one. */
  xpRunsLeft: number
  /** Place on this week's board, or null when not on it. */
  weekRank: number | null
}

export interface ArcadeBoardEntry {
  rank: number
  userId: string
  name: string
  handle: string | null
  stage: number
  score: number
  avatarConfig: LobsterAvatarConfig | null
}

export interface ArcadeBoard {
  game: ArcadeGameId
  window: ArcadeBoardWindow
  weekStart: string
  weekEnd: string
  entries: ArcadeBoardEntry[]
  /** The viewer's row when they are ranked below the list. */
  viewer: ArcadeBoardEntry | null
  /** The viewer's best for this window, or null if they have no run in it. */
  viewerBest: number | null
}

function newSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff)
}

export async function startArcadeRun(db: Db, userId: string, game: ArcadeGameId, now = new Date()): Promise<ArcadeRunTicket> {
  const seed = newSeed()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(arcadeRuns)
    .where(and(eq(arcadeRuns.userId, userId), gte(arcadeRuns.startedAt, hourAgo)))
  if (Number(count) >= ARCADE_RUNS_PER_HOUR) return { runId: null, seed }
  const [row] = await db.insert(arcadeRuns).values({ userId, game, seed, startedAt: now }).returning({ id: arcadeRuns.id })
  return { runId: row.id, seed }
}

interface Ranked {
  userId: string
  score: number
  finishedAt: string
}

/** Each member's best finished run in [from, to), best first; ties go to whoever got there first. */
async function rankedBests(db: Db, game: ArcadeGameId, from: Date | null, to: Date | null): Promise<Ranked[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT ON ("userId") "userId", "score", to_char("finishedAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "finishedAt"
    FROM arcade_runs
    WHERE "game" = ${game}
      AND "score" > 0
      AND "finishedAt" IS NOT NULL
      ${from ? sql`AND "finishedAt" >= ${from.toISOString()}` : sql``}
      ${to ? sql`AND "finishedAt" < ${to.toISOString()}` : sql``}
    ORDER BY "userId", "score" DESC, "finishedAt" ASC
  `)
  const rows = (result as unknown as { rows: { userId: string; score: number; finishedAt: string }[] }).rows ?? []
  return rows
    .map((r) => ({ userId: r.userId, score: Number(r.score) || 0, finishedAt: r.finishedAt }))
    .sort((a, b) => b.score - a.score || a.finishedAt.localeCompare(b.finishedAt) || (a.userId < b.userId ? -1 : 1))
}

const publicAvatarConfig = sql<LobsterAvatarConfig | null>`CASE WHEN ${profiles.avatarConfig} IS NULL THEN NULL ELSE (${profiles.avatarConfig} - 'accessory' - 'claws' - 'equipment') || jsonb_build_object('equipment', CASE WHEN ${profiles.equipmentVersion} = 1 THEN ${profiles.equippedAppearance} ELSE '{}'::jsonb END) END`

async function loadMembers(db: Db, ids: string[]) {
  if (!ids.length) return new Map<string, Omit<ArcadeBoardEntry, 'rank' | 'score' | 'userId'>>()
  const rows = await db
    .select({ id: profiles.id, handle: profiles.handle, larvaId: profiles.larvaId, stage: profiles.stage, avatarConfig: publicAvatarConfig })
    .from(profiles)
    .where(inArray(profiles.id, ids))
  return new Map(
    rows.map((r) => [
      r.id,
      {
        name: resolveMemberPublicName({ userId: r.id, handle: r.handle, larvaId: r.larvaId }),
        handle: r.handle ?? null,
        stage: r.stage ?? 1,
        avatarConfig: r.avatarConfig ? parseLobsterAvatarConfig(r.avatarConfig) : null,
      },
    ]),
  )
}

/** Weeks already paid by this server instance, so a busy board does not re-check every read. */
const settledWeeks = new Set<string>()

/** Pay gems to last week's top 10 for one game. Each prize has its own key, so it lands once. */
export async function settleArcadeWeek(db: Db, game: ArcadeGameId, weekStart: Date): Promise<number> {
  const weekKey = weekStart.toISOString().slice(0, 10)
  const memo = `${game}:${weekKey}`
  if (settledWeeks.has(memo)) return 0
  const ranked = (await rankedBests(db, game, weekStart, addWeeks(weekStart, 1)))
    .filter((r) => r.score >= ARCADE_GAMES[game].minRewardScore)
    .slice(0, ARCADE_BOARD_SIZE)
  const title = ARCADE_GAMES[game].title
  const label = new Date(`${weekKey}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  for (const [i, r] of ranked.entries()) {
    const gems = arcadeWeeklyGems(i + 1)
    if (!gems) continue
    await awardGems(db, r.userId, [
      {
        amount: gems,
        source: 'arcade',
        sourceKey: `arcade:${game}:week:${weekKey}`,
        description: `${title}: #${i + 1} for the week of ${label}`,
      },
    ])
  }
  settledWeeks.add(memo)
  return ranked.length
}

export async function getArcadeBoard(input: {
  game: ArcadeGameId
  window: ArcadeBoardWindow
  viewerId?: string | null
  db?: Db
  now?: Date
}): Promise<ArcadeBoard> {
  const db = input.db ?? getDb()
  const now = input.now ?? new Date()
  const weekStart = weekStartUtc(now)
  const weekEnd = addWeeks(weekStart, 1)
  try {
    await settleArcadeWeek(db, input.game, addWeeks(weekStart, -1))
  } catch (err) {
    console.warn('[arcade] weekly prize settle failed:', err)
  }
  const ranked =
    input.window === 'week' ? await rankedBests(db, input.game, weekStart, weekEnd) : await rankedBests(db, input.game, null, null)
  const top = ranked.slice(0, ARCADE_BOARD_SIZE)
  const viewerIndex = input.viewerId ? ranked.findIndex((r) => r.userId === input.viewerId) : -1
  const ids = top.map((r) => r.userId)
  if (viewerIndex >= ARCADE_BOARD_SIZE) ids.push(ranked[viewerIndex].userId)
  const members = await loadMembers(db, ids)
  const toEntry = (r: Ranked, index: number): ArcadeBoardEntry => {
    const m = members.get(r.userId)
    return {
      rank: index + 1,
      userId: r.userId,
      name: m?.name ?? 'Member',
      handle: m?.handle ?? null,
      stage: m?.stage ?? 1,
      score: r.score,
      avatarConfig: m?.avatarConfig ?? null,
    }
  }
  return {
    game: input.game,
    window: input.window,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    entries: top.map(toEntry),
    viewer: viewerIndex >= ARCADE_BOARD_SIZE ? toEntry(ranked[viewerIndex], viewerIndex) : null,
    viewerBest: viewerIndex >= 0 ? ranked[viewerIndex].score : null,
  }
}

export async function finishArcadeRun(
  db: Db,
  userId: string,
  input: { runId: string; game: ArcadeGameId; score: number },
  now = new Date(),
): Promise<ArcadeRunResult> {
  const game = ARCADE_GAMES[input.game]
  const [run] = await db
    .select({ id: arcadeRuns.id, startedAt: arcadeRuns.startedAt, finishedAt: arcadeRuns.finishedAt })
    .from(arcadeRuns)
    .where(and(eq(arcadeRuns.id, input.runId), eq(arcadeRuns.userId, userId), eq(arcadeRuns.game, input.game)))
    .limit(1)
  if (!run || run.finishedAt) throw new Error('That run has already ended.')

  const elapsed = now.getTime() - new Date(run.startedAt).getTime()
  const fair = elapsed <= ARCADE_RUN_MAX_MS && isPlausibleScore(game, input.score, elapsed)
  const [updated] = await db
    .update(arcadeRuns)
    .set({ score: fair ? input.score : null, finishedAt: now })
    .where(and(eq(arcadeRuns.id, run.id), isNull(arcadeRuns.finishedAt)))
    .returning({ id: arcadeRuns.id })
  if (!updated) throw new Error('That run has already ended.')

  const [{ best }] = await db
    .select({ best: sql<number>`COALESCE(MAX(${arcadeRuns.score}), 0)::int` })
    .from(arcadeRuns)
    .where(and(eq(arcadeRuns.userId, userId), eq(arcadeRuns.game, input.game), sql`${arcadeRuns.id} <> ${run.id}`))
  const previousBest = Number(best) || 0

  const dayStart = new Date(`${arcadeDay(now)}T00:00:00Z`)
  const [{ rewarded }] = await db
    .select({ rewarded: sql<number>`count(*)::int` })
    .from(xpTransactions)
    .where(and(eq(xpTransactions.userId, userId), eq(xpTransactions.source, 'arcade'), gte(xpTransactions.createdAt, dayStart)))
  let xp = 0
  let rewardedToday = Number(rewarded) || 0
  if (fair && arcadeRunEarnsXp(game, input.score, rewardedToday)) {
    const inserted = await db
      .insert(xpTransactions)
      .values({
        userId,
        amount: ARCADE_XP_PER_RUN,
        source: 'arcade',
        sourceKey: `arcade:run:${run.id}`,
        description: `${game.title}: scored ${input.score}`,
      })
      .onConflictDoNothing()
      .returning({ id: xpTransactions.id })
    if (inserted.length) {
      xp = ARCADE_XP_PER_RUN
      rewardedToday += 1
      try {
        const { syncUserProgression } = await import('./db-services')
        await syncUserProgression(db, userId)
      } catch (err) {
        console.warn('[arcade] progression sync failed:', err)
      }
    }
  }

  let weekRank: number | null = null
  if (fair && input.score > 0) {
    const weekStart = weekStartUtc(now)
    const ranked = await rankedBests(db, input.game, weekStart, addWeeks(weekStart, 1))
    const index = ranked.findIndex((r) => r.userId === userId)
    weekRank = index >= 0 ? index + 1 : null
  }

  return {
    saved: fair,
    score: input.score,
    previousBest,
    isBest: fair && input.score > previousBest,
    xp,
    xpRunsLeft: Math.max(0, ARCADE_XP_RUNS_PER_DAY - rewardedToday),
    weekRank,
  }
}

/* ── Server function handlers ─────────────────────────────── */

export async function startArcadeRunHandler(args: {
  data: { token?: string; game: ArcadeGameId }
  context?: WriteAuthContext
}): Promise<ArcadeRunTicket> {
  const auth = await resolveWriteAuth({ ...args, requireAuth: false })
  if (!auth) return { runId: null, seed: newSeed() }
  return startArcadeRun(getDb(), auth.userId, args.data.game)
}

export async function finishArcadeRunHandler(args: {
  data: { token?: string; game: ArcadeGameId; runId: string; score: number }
  context?: WriteAuthContext
}): Promise<ArcadeRunResult> {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  return finishArcadeRun(getDb(), auth.userId, args.data)
}

export async function getArcadeBoardHandler(args: {
  data: { token?: string; game: ArcadeGameId; window: ArcadeBoardWindow }
  context?: WriteAuthContext
}): Promise<ArcadeBoard> {
  const auth = await resolveWriteAuth({ ...args, requireAuth: false }).catch(() => null)
  return getArcadeBoard({ game: args.data.game, window: args.data.window, viewerId: auth?.userId ?? null })
}
