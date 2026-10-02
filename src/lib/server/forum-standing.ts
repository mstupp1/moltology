import { and, desc, eq, gte, isNull, ne, or, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { forumPosts, forumTopics, forumVotes, profiles, signupRiskEvents } from '../../db/schema'
import { isAdminOrSuperAdmin } from '../permissions'
import {
  STANDING_COPY,
  STANDING_RESTRICTED_DAILY_REPLIES,
  evaluateForumStanding,
  isFlaggedSignupLevel,
  reviewOutcome,
  tallyStandingDeltas,
  type ForumStandingDecision,
  type ReviewVerdict,
} from '../forum-standing'
import { screenForumSubmission, type ForumGateEvaluator } from '../quality/forum-gate'

type Db = ReturnType<typeof getDb>

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Upvotes other members gave this member's topics and replies.
 * Self-votes don't count.
 */
export async function countUpvotesReceived(dbClient: Db, userId: string): Promise<number> {
  const [row] = await dbClient
    .select({ count: sql<number>`count(*)::int` })
    .from(forumVotes)
    .leftJoin(forumTopics, eq(forumVotes.topicId, forumTopics.id))
    .leftJoin(forumPosts, eq(forumVotes.postId, forumPosts.id))
    .where(
      and(
        ne(forumVotes.userId, userId),
        or(eq(forumTopics.userId, userId), eq(forumPosts.userId, userId)),
      ),
    )
  return Number(row?.count ?? 0)
}

export async function computeMemberStanding(dbClient: Db, userId: string): Promise<number> {
  const [profile] = await dbClient
    .select({ standingAdjustment: profiles.standingAdjustment })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)
  return (await countUpvotesReceived(dbClient, userId)) + (profile?.standingAdjustment ?? 0)
}

async function wasSignupFlagged(userId: string): Promise<boolean> {
  try {
    // signup_risk_events is server-only under RLS, so read it with the owner client.
    const rows = await getDb()
      .select({ riskLevel: signupRiskEvents.riskLevel, action: signupRiskEvents.action })
      .from(signupRiskEvents)
      .where(eq(signupRiskEvents.userId, userId))
      .orderBy(desc(signupRiskEvents.createdAt))
      .limit(5)
    return rows.some((r) => isFlaggedSignupLevel(r.riskLevel) || r.action === 'require_email_verification')
  } catch (err) {
    console.warn('[forum-standing] Could not read signup risk; treating as unflagged', err)
    return false
  }
}

export async function loadForumStanding(
  dbClient: Db,
  userId: string,
  email?: string | null,
  now: Date = new Date(),
): Promise<ForumStandingDecision> {
  const [profile] = await dbClient
    .select({
      role: profiles.role,
      xp: profiles.xp,
      createdAt: profiles.createdAt,
      standingAdjustment: profiles.standingAdjustment,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1)

  const isAdmin = isAdminOrSuperAdmin({ email, role: profile?.role }, profile?.role)
  const [upvotes, signupFlagged] = await Promise.all([
    countUpvotesReceived(dbClient, userId),
    isAdmin ? Promise.resolve(false) : wasSignupFlagged(userId),
  ])

  return evaluateForumStanding({
    standing: upvotes + (profile?.standingAdjustment ?? 0),
    xp: profile?.xp ?? 0,
    accountCreatedAt: profile?.createdAt ?? now,
    isAdmin,
    signupFlagged,
    now,
  })
}

export async function assertCanStartTopic(
  dbClient: Db,
  userId: string,
  email?: string | null,
): Promise<ForumStandingDecision> {
  const decision = await loadForumStanding(dbClient, userId, email)
  if (!decision.canStartTopics) {
    throw new Error(decision.topicLockReason || STANDING_COPY.topicLockedNew)
  }
  return decision
}

/** Low-Standing members get a small daily reply allowance. */
export async function assertCanReply(
  dbClient: Db,
  userId: string,
  email?: string | null,
  now: Date = new Date(),
): Promise<ForumStandingDecision> {
  const decision = await loadForumStanding(dbClient, userId, email, now)
  if (!decision.restricted) return decision

  const [row] = await dbClient
    .select({ count: sql<number>`count(*)::int` })
    .from(forumPosts)
    .where(and(eq(forumPosts.userId, userId), gte(forumPosts.createdAt, new Date(now.getTime() - DAY_MS))))
  if (Number(row?.count ?? 0) >= STANDING_RESTRICTED_DAILY_REPLIES) {
    throw new Error(STANDING_COPY.replyCapReached)
  }
  return decision
}

/* ── 12-hour review ─────────────────────────────────────────── */

/** Only recent work is reviewed, so the first run doesn't rescore the archive. */
export const REVIEW_LOOKBACK_DAYS = 7
export const REVIEW_BATCH_LIMIT = 25
/** The live gate has a 1.2s budget. The review can wait longer. */
export const REVIEW_JEV_TIMEOUT_MS = 10_000

export interface ReviewedItem {
  kind: 'topic' | 'reply'
  id: string
  userId: string
  verdict: ReviewVerdict
  qualityScore: number | null
  standingDelta: number
  sunk: boolean
}

export interface MemberReviewResult {
  reviewed: ReviewedItem[]
  /** Jev had no answer; these stay queued for the next cycle. */
  deferred: number
  standingChanges: Array<{ userId: string; delta: number }>
}

/**
 * Reviews unreviewed topics and replies from real members (not simulated
 * ones). Strong posts raise the author's Standing, weak ones lower it and
 * sink. Never casts votes on anyone's behalf.
 */
export async function reviewMemberPosts(
  dbClient: Db,
  options: { dryRun?: boolean; now?: Date; evaluate?: ForumGateEvaluator } = {},
): Promise<MemberReviewResult> {
  const now = options.now ?? new Date()
  const since = new Date(now.getTime() - REVIEW_LOOKBACK_DAYS * DAY_MS)

  const topics = await dbClient
    .select({
      id: forumTopics.id,
      userId: forumTopics.userId,
      title: forumTopics.title,
      content: forumTopics.content,
      qualityScore: forumTopics.qualityScore,
    })
    .from(forumTopics)
    .innerJoin(profiles, eq(forumTopics.userId, profiles.id))
    .where(
      and(
        isNull(forumTopics.reviewedAt),
        isNull(forumTopics.deletedAt),
        eq(profiles.isSimulated, false),
        gte(forumTopics.createdAt, since),
      ),
    )
    .orderBy(forumTopics.createdAt)
    .limit(REVIEW_BATCH_LIMIT)

  const replies = await dbClient
    .select({
      id: forumPosts.id,
      userId: forumPosts.userId,
      content: forumPosts.content,
      qualityScore: forumPosts.qualityScore,
      topicTitle: forumTopics.title,
    })
    .from(forumPosts)
    .innerJoin(profiles, eq(forumPosts.userId, profiles.id))
    .innerJoin(forumTopics, eq(forumPosts.topicId, forumTopics.id))
    .where(
      and(
        isNull(forumPosts.reviewedAt),
        isNull(forumPosts.deletedAt),
        eq(profiles.isSimulated, false),
        gte(forumPosts.createdAt, since),
      ),
    )
    .orderBy(forumPosts.createdAt)
    .limit(REVIEW_BATCH_LIMIT)

  const screen = (title: string, body: string) =>
    screenForumSubmission(
      { title, body },
      { evaluate: options.evaluate, timeoutMs: REVIEW_JEV_TIMEOUT_MS },
    )

  const reviewed: ReviewedItem[] = []
  let deferred = 0

  // Every post gets a fresh pass so prohibited content that slipped past a
  // live timeout is caught. The live score is the fallback.
  for (const topic of topics) {
    const decision = await screen(topic.title, topic.content)
    const qualityScore = decision.source === 'jev' ? decision.qualityScore : topic.qualityScore
    const outcome = reviewOutcome({ qualityScore, prohibited: decision.status === 'quarantine' })
    if (!outcome || !topic.userId) {
      deferred += 1
      continue
    }
    reviewed.push({ kind: 'topic', id: topic.id, userId: topic.userId, qualityScore, ...withSunk(outcome) })
    if (!options.dryRun) {
      await dbClient
        .update(forumTopics)
        .set({
          reviewedAt: now,
          qualityScore,
          ...(outcome.sink ? { discoveryEligible: false } : {}),
        })
        .where(eq(forumTopics.id, topic.id))
    }
  }

  for (const reply of replies) {
    const decision = await screen(reply.topicTitle, reply.content)
    const qualityScore = decision.source === 'jev' ? decision.qualityScore : reply.qualityScore
    const outcome = reviewOutcome({ qualityScore, prohibited: decision.status === 'quarantine' })
    if (!outcome || !reply.userId) {
      deferred += 1
      continue
    }
    reviewed.push({ kind: 'reply', id: reply.id, userId: reply.userId, qualityScore, ...withSunk(outcome) })
    if (!options.dryRun) {
      await dbClient
        .update(forumPosts)
        .set({
          reviewedAt: now,
          qualityScore,
          // The review only sinks. Raising a sunk reply is left to staff.
          ...(outcome.sink ? { sunk: true } : {}),
        })
        .where(eq(forumPosts.id, reply.id))
    }
  }

  const totals = tallyStandingDeltas(reviewed)
  const standingChanges = [...totals]
    .filter(([, delta]) => delta !== 0)
    .map(([userId, delta]) => ({ userId, delta }))

  if (!options.dryRun) {
    for (const { userId, delta } of standingChanges) {
      await dbClient
        .update(profiles)
        .set({ standingAdjustment: sql`${profiles.standingAdjustment} + ${delta}` })
        .where(eq(profiles.id, userId))
    }
  }

  return { reviewed, deferred, standingChanges }
}

function withSunk(outcome: { verdict: ReviewVerdict; standingDelta: number; sink: boolean }) {
  return { verdict: outcome.verdict, standingDelta: outcome.standingDelta, sunk: outcome.sink }
}
