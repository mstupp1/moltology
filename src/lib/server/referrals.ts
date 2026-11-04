import { and, desc, eq, notExists, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { memberReferrals, profiles, referralRewards, xpTransactions } from '../../db/schema'
import { CANONICAL_ALIGNMENT_TASKS } from '../alignment-tasks'
import { resolveMemberPublicName } from '../member-handle'
import { STAGE_THRESHOLDS } from '../progression'
import {
  REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, REFERRAL_MONTHLY_CAP, REFERRAL_XP,
  profileSharePath, readReferralCookie, type ReferralSummary,
} from '../referrals'
import { resolveWriteAuth, type WriteAuthContext } from './write-auth'

type Db = ReturnType<typeof getDb>

async function prepareReferralProgression(db: Db, userId: string) {
  const legacyMinimum = sql<number>`CASE ${sql.join(STAGE_THRESHOLDS.map((stage) =>
    sql`WHEN ${profiles.stage} = ${stage.stage} THEN ${stage.minXp}`), sql` `)} ELSE 0 END`
  // Serialize legacy initialization before adding a member's first ledger award.
  await db.batch([
    db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).for('update'),
    db.insert(xpTransactions).select(db.select({
      id: sql<string>`gen_random_uuid()`.as('id'),
      userId: profiles.id,
      amount: sql<number>`GREATEST(${profiles.xp}, ${legacyMinimum})`.as('amount'),
      source: sql<string>`'legacy_stage_migration'`.as('source'),
      sourceKey: sql<string>`'legacy_stage:' || ${profiles.stage}`.as('sourceKey'),
      description: sql<string>`'Legacy clearance alignment'`.as('description'),
      createdAt: sql<Date>`now()`.as('createdAt'),
    }).from(profiles).where(and(
      eq(profiles.id, userId),
      sql`(${profiles.xp} > 0 OR ${profiles.stage} > 1)`,
      notExists(db.select({ id: xpTransactions.id }).from(xpTransactions).where(eq(xpTransactions.userId, userId))),
    ))).onConflictDoNothing(),
  ])
}

async function syncReferralProgression(db: Db, userId: string) {
  const total = sql<number>`(SELECT COALESCE(SUM(amount), 0)::int FROM xp_transactions WHERE "userId" = ${userId})`
  const stage = sql<number>`CASE ${sql.join([...STAGE_THRESHOLDS].reverse().map((tier) =>
    sql`WHEN ${total} >= ${tier.minXp} THEN ${tier.stage}`), sql` `)} ELSE 1 END`
  // A fresh statement snapshot after the row lock prevents concurrent referral
  // activations from overwriting the cache with an older ledger sum.
  await db.batch([
    db.select({ id: profiles.id }).from(profiles).where(eq(profiles.id, userId)).for('update'),
    db.update(profiles).set({ xp: total, stage, updatedAt: new Date() }).where(eq(profiles.id, userId)),
  ])
}

export async function handleInvitation(request: Request, referrerId: string): Promise<Response> {
  const [member] = await getDb().select({ id: profiles.id, handle: profiles.handle, larvaId: profiles.larvaId })
    .from(profiles).where(and(eq(profiles.id, referrerId), eq(profiles.isSimulated, false))).limit(1)
  if (!member) return new Response('Invitation unavailable.', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  const destination = new URL('/auth', request.url)
  destination.searchParams.set('mode', 'signup')
  destination.searchParams.set('redirect', profileSharePath(member.id))
  destination.searchParams.set('invitedBy', resolveMemberPublicName({ ...member, userId: member.id }))
  return new Response(null, {
    status: 302,
    headers: {
      Location: destination.pathname + destination.search,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Set-Cookie': `${REFERRAL_COOKIE}=${encodeURIComponent(member.id)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFERRAL_COOKIE_MAX_AGE}${destination.protocol === 'https:' ? '; Secure' : ''}`,
    },
  })
}

/** Called only by Better Auth's user-create hook, for email and Google signup. */
export async function captureSignupReferral(userId: string, request?: Request): Promise<void> {
  const referrerId = readReferralCookie(request?.headers.get('cookie'))
  if (!referrerId || referrerId === userId) return
  // Attribution and public provenance commit together. Existing accounts cannot
  // call this through an RPC, and a replay never replaces the original sponsor.
  await getDb().execute(sql`
    WITH attributed AS (
      INSERT INTO member_referrals ("referrerId", "referredUserId")
      SELECT sponsor.id, newcomer.id FROM profiles sponsor, profiles newcomer
      WHERE sponsor.id = ${referrerId} AND newcomer.id = ${userId}
        AND sponsor."isSimulated" = false AND newcomer."isSimulated" = false
        AND newcomer."referredByUserId" IS NULL
      ON CONFLICT DO NOTHING RETURNING "referrerId", "referredUserId"
    )
    UPDATE profiles p SET "referredByUserId" = a."referrerId", "joinSource" = 'brought_in'
    FROM attributed a WHERE p.id = a."referredUserId"
  `)
}

/** Called on both character creation and liturgy completion, in either order. */
export async function qualifyReferral(db: Db, userId: string): Promise<void> {
  const taskKeys = sql.join(CANONICAL_ALIGNMENT_TASKS.map((task) => sql`${task.key}`), sql`, `)
  const result = await db.execute(sql`
    UPDATE member_referrals r SET "qualifiedAt" = COALESCE(r."qualifiedAt", now() AT TIME ZONE 'UTC')
    FROM profiles p, profiles sponsor
    WHERE r."referredUserId" = ${userId} AND p.id = r."referredUserId"
      AND sponsor.id = r."referrerId" AND sponsor."isSimulated" = false
      AND p."isSimulated" = false AND p.handle IS NOT NULL
      AND length(COALESCE(p."avatarConfig"->>'seed', '')) > 0
      AND EXISTS (SELECT 1 FROM routine_completions c WHERE c."userId" = p.id AND c."taskKey" IN (${taskKeys}))
      AND NOT EXISTS (SELECT 1 FROM referral_rewards w WHERE w."referralId" = r.id)
    RETURNING r.id, r."referrerId", to_char(r."qualifiedAt", 'YYYY-MM') AS month
  `)
  const referral = result.rows[0] as { id: string; referrerId: string; month: string } | undefined
  if (!referral) return
  await prepareReferralProgression(db, referral.referrerId)
  // Slots and ledger insert are one statement: a failure rolls both back. Unique
  // referral id prevents duplicates; unique slots enforce the concurrent cap.
  for (let slot = 1; slot <= REFERRAL_MONTHLY_CAP; slot++) {
    const award = await db.execute(sql`
      WITH claimed AS (
        INSERT INTO referral_rewards ("referralId", "referrerId", month, slot)
        VALUES (${referral.id}, ${referral.referrerId}, ${referral.month}, ${slot})
        ON CONFLICT DO NOTHING RETURNING "referralId", "referrerId"
      )
      INSERT INTO xp_transactions ("userId", amount, source, "sourceKey", description)
      SELECT "referrerId", ${REFERRAL_XP}, 'referral', 'referral:' || "referralId", 'A referred member completed onboarding and their first liturgy'
      FROM claimed RETURNING "userId"
    `)
    if (award.rows.length) {
      await syncReferralProgression(db, referral.referrerId)
      return
    }
  }
}

/** Optional growth rewards must never fail the member's primary action. */
export async function tryQualifyReferral(db: Db, userId: string): Promise<void> {
  try { await qualifyReferral(db, userId) }
  catch { console.warn('[referrals] Could not qualify referral; retry on the next member action.') }
}

export async function getReferralSummaryHandler(args: {
  data?: { token?: string }; context?: WriteAuthContext
}): Promise<ReferralSummary> {
  const auth = await resolveWriteAuth(args)
  if (!auth) throw new Error('Authentication required.')
  const { dbClient: db, userId } = auth
  const [totalsResult, rows] = await Promise.all([
    db.execute(sql`SELECT count(*)::int AS total,
      count(*) FILTER (WHERE month = to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM'))::int AS month
      FROM referral_rewards WHERE "referrerId" = ${userId}`),
    db.select({ id: memberReferrals.id, memberId: profiles.id, handle: profiles.handle, larvaId: profiles.larvaId,
      qualifiedAt: memberReferrals.qualifiedAt, rewardId: referralRewards.referralId,
      qualifyingMonthRewards: sql<number>`(SELECT count(*)::int FROM referral_rewards w
        WHERE w."referrerId" = ${memberReferrals.referrerId}
          AND w.month = to_char(${memberReferrals.qualifiedAt}, 'YYYY-MM'))`,
    })
      .from(memberReferrals).leftJoin(profiles, eq(profiles.id, memberReferrals.referredUserId))
      .leftJoin(referralRewards, eq(referralRewards.referralId, memberReferrals.id))
      .where(eq(memberReferrals.referrerId, userId)).orderBy(desc(memberReferrals.createdAt)).limit(20),
  ])
  const totals = totalsResult.rows[0] as { total: number; month: number }
  return {
    userId, rewardedThisMonth: totals.month, totalXp: totals.total * REFERRAL_XP,
    referrals: rows.map((row) => ({
      id: row.id,
      displayName: row.memberId ? resolveMemberPublicName({ userId: row.memberId, handle: row.handle, larvaId: row.larvaId }) : 'Deleted member',
      status: row.rewardId ? 'rewarded' : row.qualifiedAt
        ? row.qualifyingMonthRewards >= REFERRAL_MONTHLY_CAP ? 'cap_reached' : 'qualified'
        : 'pending',
    })),
  }
}
