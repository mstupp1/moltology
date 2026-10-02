import { describe, expect, it } from 'vitest'
import {
  REPLY_SINK_QUALITY_BELOW,
  STANDING_COPY,
  STANDING_TOPIC_XP_PATH,
  evaluateForumStanding,
  isFlaggedSignupLevel,
  reviewOutcome,
  shouldSinkReply,
  tallyStandingDeltas,
} from './forum-standing'
import { FORUM_TRENDING_QUALITY_MIN } from './quality/forum-gate'

const NOW = new Date('2026-10-02T12:00:00.000Z')
const daysAgo = (d: number) => new Date(NOW.getTime() - d * 24 * 60 * 60 * 1000)

function base(overrides: Partial<Parameters<typeof evaluateForumStanding>[0]> = {}) {
  return evaluateForumStanding({
    standing: 0,
    xp: 0,
    accountCreatedAt: daysAgo(10),
    isAdmin: false,
    signupFlagged: false,
    now: NOW,
    ...overrides,
  })
}

describe('evaluateForumStanding', () => {
  it('keeps threads locked for a fresh account even with Standing', () => {
    const d = base({ accountCreatedAt: daysAgo(1), standing: 10 })
    expect(d.canStartTopics).toBe(false)
    expect(d.topicLockReason).toBe(STANDING_COPY.topicLockedNew)
  })

  it('locks threads for an older account with no Standing or clearance', () => {
    expect(base().canStartTopics).toBe(false)
  })

  it('unlocks threads with 3 Standing after 3 days', () => {
    const d = base({ standing: 3, accountCreatedAt: daysAgo(3) })
    expect(d.canStartTopics).toBe(true)
    expect(d.topicLockReason).toBeNull()
  })

  it('unlocks threads through Shell Sprout XP', () => {
    expect(base({ xp: STANDING_TOPIC_XP_PATH }).canStartTopics).toBe(true)
  })

  it('closes the XP path for signup-flagged accounts', () => {
    const d = base({ xp: 5000, signupFlagged: true })
    expect(d.canStartTopics).toBe(false)
    expect(d.topicLockReason).toBe(STANDING_COPY.topicLockedFlagged)
    expect(base({ standing: 3, signupFlagged: true }).canStartTopics).toBe(true)
  })

  it('restricts members at -5 Standing even with XP', () => {
    const d = base({ standing: -5, xp: 9000 })
    expect(d.restricted).toBe(true)
    expect(d.canStartTopics).toBe(false)
    expect(d.topicLockReason).toBe(STANDING_COPY.topicLockedRestricted)
    expect(base({ standing: -4 }).restricted).toBe(false)
  })

  it('lets admins through regardless', () => {
    const d = base({ isAdmin: true, standing: -20, accountCreatedAt: daysAgo(0) })
    expect(d.canStartTopics).toBe(true)
    expect(d.restricted).toBe(false)
  })
})

describe('isFlaggedSignupLevel', () => {
  it('flags suspicious and high risk only', () => {
    expect(isFlaggedSignupLevel('suspicious')).toBe(true)
    expect(isFlaggedSignupLevel('high_risk')).toBe(true)
    expect(isFlaggedSignupLevel('low_risk')).toBe(false)
    expect(isFlaggedSignupLevel(null)).toBe(false)
  })
})

describe('shouldSinkReply', () => {
  it('matches the Hot quality bar', () => {
    expect(REPLY_SINK_QUALITY_BELOW).toBe(FORUM_TRENDING_QUALITY_MIN)
  })

  it('sinks thin replies and replies from negative Standing', () => {
    expect(shouldSinkReply({ qualityScore: 25, authorStanding: 10 })).toBe(true)
    expect(shouldSinkReply({ qualityScore: 75, authorStanding: -1 })).toBe(true)
    expect(shouldSinkReply({ qualityScore: 50, authorStanding: 0 })).toBe(false)
    expect(shouldSinkReply({ qualityScore: null, authorStanding: 0 })).toBe(false)
  })
})

describe('reviewOutcome', () => {
  it('defers when there is no score', () => {
    expect(reviewOutcome({ qualityScore: null, prohibited: false })).toBeNull()
  })

  it('rewards strong posts, sinks weak ones, and penalizes prohibited ones hardest', () => {
    expect(reviewOutcome({ qualityScore: 100, prohibited: false })).toEqual({ verdict: 'strong', standingDelta: 1, sink: false })
    expect(reviewOutcome({ qualityScore: 50, prohibited: false })).toEqual({ verdict: 'ordinary', standingDelta: 0, sink: false })
    expect(reviewOutcome({ qualityScore: 25, prohibited: false })).toEqual({ verdict: 'ordinary', standingDelta: 0, sink: true })
    expect(reviewOutcome({ qualityScore: 0, prohibited: false })).toEqual({ verdict: 'weak', standingDelta: -1, sink: true })
    expect(reviewOutcome({ qualityScore: 100, prohibited: true })).toEqual({ verdict: 'prohibited', standingDelta: -3, sink: true })
  })
})

describe('tallyStandingDeltas', () => {
  it('caps gains per cycle but not losses', () => {
    const totals = tallyStandingDeltas([
      { userId: 'a', standingDelta: 1 },
      { userId: 'a', standingDelta: 1 },
      { userId: 'a', standingDelta: 1 },
      { userId: 'b', standingDelta: -3 },
      { userId: 'b', standingDelta: -1 },
    ])
    expect(totals.get('a')).toBe(2)
    expect(totals.get('b')).toBe(-4)
  })
})
