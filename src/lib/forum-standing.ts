/**
 * Forum Standing decides who may open threads and which replies sink.
 * Standing is upvotes from other members plus review adjustments.
 *
 * Pure rules live here. Reads and writes live in server/forum-standing.ts.
 */

/** Minimum account age before a member may open threads. */
export const STANDING_TOPIC_MIN_ACCOUNT_DAYS = 3
/** Standing that unlocks threads on its own (after the age wait). */
export const STANDING_TOPIC_MIN = 3
/** XP that also unlocks threads: Clearance L-2, Shell Sprout. Not open to signup-flagged accounts. */
export const STANDING_TOPIC_XP_PATH = 500
/** At or below this, threads lock and replies are capped per day. */
export const STANDING_RESTRICTED_AT = -5
export const STANDING_RESTRICTED_DAILY_REPLIES = 3
/** Same bar as Hot (FORUM_TRENDING_QUALITY_MIN). Kept local so client code doesn't pull in the Jev client. */
export const REPLY_SINK_QUALITY_BELOW = 50
/** Replies from members below this Standing sink. */
export const STANDING_SINK_BELOW = 0

/** Signup screening levels that keep the XP path closed. */
export const STANDING_FLAGGED_SIGNUP_LEVELS = ['suspicious', 'high_risk'] as const

const DAY_MS = 24 * 60 * 60 * 1000

export const STANDING_COPY = {
  topicLockedNew: `New members can reply right away. Starting threads unlocks once your account is ${STANDING_TOPIC_MIN_ACCOUNT_DAYS} days old and your replies have earned ${STANDING_TOPIC_MIN} Standing or you reach Shell Sprout clearance.`,
  topicLockedFlagged: `Starting threads unlocks once your account is ${STANDING_TOPIC_MIN_ACCOUNT_DAYS} days old and your replies have earned ${STANDING_TOPIC_MIN} Standing from other members.`,
  topicLockedRestricted:
    'Your Standing is too low to start threads. Helpful replies that other members upvote will raise it.',
  replyCapReached: `Your Standing is low, so replies are limited to ${STANDING_RESTRICTED_DAILY_REPLIES} a day. Try again tomorrow.`,
} as const

export interface ForumStandingInput {
  standing: number
  xp: number
  accountCreatedAt: Date | string | null | undefined
  isAdmin: boolean
  signupFlagged: boolean
  now: Date
}

export interface ForumStandingDecision {
  standing: number
  canStartTopics: boolean
  /** Replies capped per day. */
  restricted: boolean
  /** Plain-English reason shown when threads are locked. Null when open. */
  topicLockReason: string | null
}

export function accountAgeDays(createdAt: Date | string | null | undefined, now: Date): number {
  if (!createdAt) return 0
  const created = createdAt instanceof Date ? createdAt : new Date(createdAt)
  const ms = now.getTime() - created.getTime()
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return ms / DAY_MS
}

export function isFlaggedSignupLevel(riskLevel: string | null | undefined): boolean {
  return !!riskLevel && (STANDING_FLAGGED_SIGNUP_LEVELS as readonly string[]).includes(riskLevel)
}

export function evaluateForumStanding(input: ForumStandingInput): ForumStandingDecision {
  const standing = Math.trunc(input.standing || 0)
  if (input.isAdmin) {
    return { standing, canStartTopics: true, restricted: false, topicLockReason: null }
  }

  const restricted = standing <= STANDING_RESTRICTED_AT
  if (restricted) {
    return { standing, canStartTopics: false, restricted, topicLockReason: STANDING_COPY.topicLockedRestricted }
  }

  const oldEnough = accountAgeDays(input.accountCreatedAt, input.now) >= STANDING_TOPIC_MIN_ACCOUNT_DAYS
  const earnedStanding = standing >= STANDING_TOPIC_MIN
  const earnedClearance = !input.signupFlagged && (input.xp || 0) >= STANDING_TOPIC_XP_PATH
  const canStartTopics = oldEnough && (earnedStanding || earnedClearance)

  return {
    standing,
    canStartTopics,
    restricted,
    topicLockReason: canStartTopics
      ? null
      : input.signupFlagged
        ? STANDING_COPY.topicLockedFlagged
        : STANDING_COPY.topicLockedNew,
  }
}

/** A reply sinks when Jev scored it thin or its author's Standing is negative. */
export function shouldSinkReply(input: { qualityScore: number | null | undefined; authorStanding: number }): boolean {
  if (typeof input.qualityScore === 'number' && input.qualityScore < REPLY_SINK_QUALITY_BELOW) return true
  return input.authorStanding < STANDING_SINK_BELOW
}

/* ── 12-hour review ─────────────────────────────────────────── */

export const REVIEW_STRONG_MIN = 75
export const REVIEW_WEAK_BELOW = 25
export const REVIEW_STRONG_DELTA = 1
export const REVIEW_WEAK_DELTA = -1
export const REVIEW_PROHIBITED_DELTA = -3
/** One review cycle can raise an author's Standing by at most this much. */
export const REVIEW_MAX_GAIN_PER_CYCLE = 2

export type ReviewVerdict = 'strong' | 'ordinary' | 'weak' | 'prohibited'

export interface ReviewOutcome {
  verdict: ReviewVerdict
  standingDelta: number
  sink: boolean
}

/**
 * Null when Jev has no score yet, so the post stays queued for the next cycle.
 */
export function reviewOutcome(input: {
  qualityScore: number | null | undefined
  prohibited: boolean
}): ReviewOutcome | null {
  if (input.prohibited) {
    return { verdict: 'prohibited', standingDelta: REVIEW_PROHIBITED_DELTA, sink: true }
  }
  if (typeof input.qualityScore !== 'number') return null
  if (input.qualityScore >= REVIEW_STRONG_MIN) {
    return { verdict: 'strong', standingDelta: REVIEW_STRONG_DELTA, sink: false }
  }
  if (input.qualityScore < REVIEW_WEAK_BELOW) {
    return { verdict: 'weak', standingDelta: REVIEW_WEAK_DELTA, sink: true }
  }
  return {
    verdict: 'ordinary',
    standingDelta: 0,
    sink: input.qualityScore < REPLY_SINK_QUALITY_BELOW,
  }
}

/** Sums per-author deltas for one cycle, capping gains so a burst of posts can't farm Standing. */
export function tallyStandingDeltas(entries: Array<{ userId: string; standingDelta: number }>): Map<string, number> {
  const totals = new Map<string, number>()
  for (const { userId, standingDelta } of entries) {
    totals.set(userId, (totals.get(userId) ?? 0) + standingDelta)
  }
  for (const [userId, total] of totals) {
    totals.set(userId, Math.min(total, REVIEW_MAX_GAIN_PER_CYCLE))
  }
  return totals
}
