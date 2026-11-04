import { and, desc, eq, like, or, sql } from 'drizzle-orm'
import type { getDb } from '../../db'
import { gemTransactions, profiles } from '../../db/schema'
import {
  GEM_ALL_TASKS_DAILY,
  GEM_FIRSTS,
  GEM_PER_REFERRAL,
  GEM_STAGE_REWARDS,
  GEM_WELCOME_GRANT,
  gemStreakBonus,
  type GemFirstId,
  type GemSource,
  type GemWallet,
} from '../gems'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

/**
 * Statements that refresh the cached balance from the ledger. The row lock comes first so the
 * sum runs on a fresh snapshot after any concurrent award or purchase has committed
 * (each statement in a batch takes its own snapshot).
 */
function balanceRefresh(db: Db, userId: string) {
  return [
    db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).for('update'),
    db
      .update(profiles)
      .set({
        chitinGems: sql`(SELECT COALESCE(SUM(amount), 0)::int FROM gem_transactions WHERE "userId" = ${userId})`,
      })
      .where(eq(profiles.id, userId)),
  ] as const
}

export async function syncGemBalance(db: Db, userId: string): Promise<void> {
  await db.batch(balanceRefresh(db, userId))
}

export interface GemAward {
  amount: number
  source: GemSource
  sourceKey: string
  description: string
}

/** Adds awards (each at most once per source key) and refreshes the balance in one batch. */
export async function awardGems(db: Db, userId: string, awards: GemAward[]): Promise<void> {
  if (!awards.length) return
  await db.batch([
    db
      .insert(gemTransactions)
      .values(awards.map((a) => ({ userId, ...a })))
      .onConflictDoNothing(),
    ...balanceRefresh(db, userId),
  ])
}

/** Daily awards for one date: all tasks done, plus a streak milestone when one lands that day. */
export function dailyGemAwards(date: string, allDone: boolean, streakDays: number): GemAward[] {
  if (!allDone) return []
  const awards: GemAward[] = [
    {
      amount: GEM_ALL_TASKS_DAILY,
      source: 'all_tasks',
      sourceKey: `routine_all:${date}`,
      description: 'All daily liturgies done',
    },
  ]
  const streak = gemStreakBonus(streakDays)
  if (streak > 0) {
    awards.push({
      amount: streak,
      source: 'streak',
      sourceKey: `streak:${streakDays}:${date}`,
      description: `${streakDays} day streak`,
    })
  }
  return awards
}

/** Takes back a date's daily awards after a task on that date is unchecked. */
export async function revokeDailyGems(db: Db, userId: string, date: string): Promise<void> {
  await db.batch([
    db
      .delete(gemTransactions)
      .where(
        and(
          eq(gemTransactions.userId, userId),
          or(
            eq(gemTransactions.sourceKey, `routine_all:${date}`),
            like(gemTransactions.sourceKey, `streak:%:${date}`),
          ),
        ),
      ),
    ...balanceRefresh(db, userId),
  ])
}

const FIRST_CONDITIONS: Record<GemFirstId, (userId: string) => ReturnType<typeof sql>> = {
  handle: (u) => sql`EXISTS (SELECT 1 FROM profiles WHERE id = ${u} AND handle IS NOT NULL)`,
  moltmax: (u) => sql`EXISTS (SELECT 1 FROM user_stats WHERE "userId" = ${u} AND "moltmaxCompletedAt" IS NOT NULL)`,
  forum: (u) => sql`(EXISTS (SELECT 1 FROM forum_topics WHERE "userId" = ${u})
    OR EXISTS (SELECT 1 FROM forum_posts WHERE "userId" = ${u}))`,
  friend: (u) => sql`EXISTS (SELECT 1 FROM friendships WHERE "userAId" = ${u} OR "userBId" = ${u})`,
  certificate: (u) => sql`EXISTS (SELECT 1 FROM academy_certificate_awards WHERE "userId" = ${u})`,
}

/**
 * Grants every one-time award the member qualifies for: the welcome grant, stages reached,
 * firsts, and rewarded referrals. Reads current state, so it is safe to run any time and
 * catches up members who did things before gems existed.
 */
export async function checkGemMilestones(db: Db, userId: string): Promise<void> {
  const stageValues = sql.join(
    GEM_STAGE_REWARDS.map((r) => sql`(${r.stage}::int, ${r.gems}::int)`),
    sql`, `,
  )
  const firstValues = sql.join(
    GEM_FIRSTS.map(
      (f) =>
        sql`SELECT ${'first:' + f.id} AS key, ${f.gems}::int AS gems, ${f.title} AS title WHERE ${FIRST_CONDITIONS[f.id](userId)}`,
    ),
    sql` UNION ALL `,
  )
  await db.batch([
    db.execute(sql`INSERT INTO gem_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, ${GEM_WELCOME_GRANT}, 'welcome', 'welcome', 'Welcome to the market'
      WHERE EXISTS (SELECT 1 FROM profiles WHERE id = ${userId})
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO gem_transactions ("userId", amount, source, "sourceKey", description)
      SELECT p.id, r.gems, 'stage', 'stage:' || r.stage, 'Reached stage ' || r.stage
      FROM profiles p CROSS JOIN (VALUES ${stageValues}) AS r(stage, gems)
      WHERE p.id = ${userId} AND p.stage >= r.stage
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO gem_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, f.gems, 'first', f.key, f.title FROM (${firstValues}) AS f
      ON CONFLICT DO NOTHING`),
    db.execute(sql`INSERT INTO gem_transactions ("userId", amount, source, "sourceKey", description)
      SELECT ${userId}, ${GEM_PER_REFERRAL}, 'referral', 'referral:' || "referralId", 'A member you invited got started'
      FROM referral_rewards WHERE "referrerId" = ${userId}
      ON CONFLICT DO NOTHING`),
    ...balanceRefresh(db, userId),
  ])
}

/** Best-effort milestone check after a member action. Never fails the action itself. */
export async function tryCheckGemMilestones(db: Db, userId: string): Promise<void> {
  try {
    await checkGemMilestones(db, userId)
  } catch (err) {
    console.warn('[gems] milestone check failed; it will run again on the next action.', err)
  }
}

export async function getGemWallet(db: Db, userId: string, historyLimit = 20): Promise<GemWallet> {
  await checkGemMilestones(db, userId)
  const [balanceRows, history, done] = await Promise.all([
    db.select({ balance: profiles.chitinGems }).from(profiles).where(eq(profiles.id, userId)).limit(1),
    db
      .select({
        id: gemTransactions.id,
        amount: gemTransactions.amount,
        source: gemTransactions.source,
        description: gemTransactions.description,
        createdAt: gemTransactions.createdAt,
      })
      .from(gemTransactions)
      .where(eq(gemTransactions.userId, userId))
      .orderBy(desc(gemTransactions.createdAt), desc(gemTransactions.id))
      .limit(historyLimit),
    db
      .select({ key: gemTransactions.sourceKey })
      .from(gemTransactions)
      .where(and(eq(gemTransactions.userId, userId), like(gemTransactions.sourceKey, 'first:%'))),
  ])
  const doneKeys = new Set(done.map((d) => d.key))
  return {
    balance: balanceRows[0]?.balance ?? 0,
    history: history.map((h) => ({ ...h, createdAt: new Date(h.createdAt).toISOString() })),
    firsts: GEM_FIRSTS.map((f) => ({ ...f, done: doneKeys.has(`first:${f.id}`) })),
  }
}

export async function getGemWalletHandler(args: {
  data?: { token?: string }
  context?: WriteAuthContext
}): Promise<GemWallet> {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  return getGemWallet(auth.dbClient, auth.userId)
}
