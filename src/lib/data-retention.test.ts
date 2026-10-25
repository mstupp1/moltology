import { describe, expect, it } from 'vitest'
import {
  LEAN_WINDOWS,
  LENIENT_WINDOWS,
  NEON_FREE_BRANCH_LIMIT_BYTES,
  STORAGE_CRITICAL_RATIO,
  STORAGE_WARN_RATIO,
  archiveObjectKey,
  buildTablePolicies,
  cutoffDate,
  cutoffDateString,
  evaluateStorageHeadroom,
  getRetentionWindows,
  isClosedFriendRequestEligibleForDelete,
  isNotificationEligibleForDelete,
  isPastCutoff,
  parseRetentionProfile,
} from './data-retention'

const NOW = new Date('2026-09-06T12:00:00.000Z')

function daysAgo(days: number): Date {
  return cutoffDate(NOW, days)
}

describe('retention profile', () => {
  it('defaults unknown values to lean', () => {
    expect(parseRetentionProfile(undefined)).toBe('lean')
    expect(parseRetentionProfile('')).toBe('lean')
    expect(parseRetentionProfile('strict')).toBe('lean')
  })

  it('selects the lenient overlay when requested', () => {
    expect(parseRetentionProfile('lenient')).toBe('lenient')
    expect(getRetentionWindows('lenient')).toEqual(LENIENT_WINDOWS)
    expect(getRetentionWindows('lean')).toEqual(LEAN_WINDOWS)
  })

  it('keeps lean windows shorter except for shared chat and routine retention limits', () => {
    for (const key of Object.keys(LEAN_WINDOWS) as Array<keyof typeof LEAN_WINDOWS>) {
      if (key === 'routineDaySummaryDays' || key === 'chatArchivedDays') continue
      expect(LEAN_WINDOWS[key]).toBeLessThan(LENIENT_WINDOWS[key])
    }
    expect(LEAN_WINDOWS.routineDaySummaryDays).toBe(91)
    expect(LENIENT_WINDOWS.routineDaySummaryDays).toBe(91)
    expect(LEAN_WINDOWS.chatArchivedDays).toBe(30)
    expect(LENIENT_WINDOWS.chatArchivedDays).toBe(30)
    expect(LENIENT_WINDOWS.routineCompletionsHotDays).toBeLessThanOrEqual(90)
  })
})

describe('table policies', () => {
  it('classifies high-churn tables as deletable and canon as keep-forever', () => {
    const policies = buildTablePolicies(LEAN_WINDOWS)
    const byTable = Object.fromEntries(policies.map((policy) => [policy.table, policy]))

    expect(byTable.activity_events.retentionClass).toBe('hot-delete')
    expect(byTable.activity_events.deleteAfterDays).toBe(14)
    expect(byTable.routine_completions.retentionClass).toBe('hot-summarize-delete')
    expect(byTable.routine_completions.summarizeAfterDays).toBe(45)
    expect(byTable.ai_threads.retentionClass).toBe('hot-delete')
    expect(byTable.ai_threads.hotDays).toBe(30)
    expect(byTable.ai_threads.deleteAfterDays).toBe(30)
    expect(byTable.ai_messages.retentionClass).toBe('canonical')
    expect(byTable.ai_messages.hotDays).toBeNull()
    expect(byTable.ai_messages.deleteAfterDays).toBeUndefined()
    expect(byTable.profiles.hotDays).toBeNull()
    expect(byTable.forum_posts.hotDays).toBeNull()
    expect(byTable.blog_posts.hotDays).toBeNull()
    expect(byTable.leads.retentionClass).toBe('legal')
    expect(byTable.support_tickets.retentionClass).toBe('legal')
    expect(byTable.support_tickets.hotDays).toBeNull()
    expect(byTable.xp_transactions.hotDays).toBeNull()
    expect(byTable.signup_risk_events.hotDays).toBeNull()
    expect(byTable.member_bonds.hotDays).toBeNull()
    // Both member types need the same 90-day UI horizon; a telemetry TTL would truncate it.
    expect(byTable.routine_completions.simulatedDays).toBeUndefined()
    expect(byTable.routine_day_summaries.hotDays).toBe(91)
    // Usage retention must not remove any event inside the rolling 7-day limit.
    expect(byTable.ai_usage_events.hotDays).toBeGreaterThanOrEqual(7)
    expect(byTable.ai_usage_daily_summaries.hotDays).toBe(400)
  })

  it('keeps chat retention shared while lenient mode extends other retention windows', () => {
    const lean = Object.fromEntries(buildTablePolicies(LEAN_WINDOWS).map((policy) => [policy.table, policy]))
    const lenient = Object.fromEntries(buildTablePolicies(LENIENT_WINDOWS).map((policy) => [policy.table, policy]))
    expect(lenient.ai_threads.deleteAfterDays).toBe(lean.ai_threads.deleteAfterDays)
    expect(lenient.ai_messages.hotDays).toBeNull()
    expect(lenient.routine_completions.deleteAfterDays).toBe(91)
  })
})

describe('cutoffs', () => {
  it('computes UTC day cutoffs for timestamps and YYYY-MM-DD columns', () => {
    expect(cutoffDate(NOW, 14).toISOString()).toBe('2026-08-23T12:00:00.000Z')
    expect(cutoffDateString(NOW, 45)).toBe('2026-07-23')
    expect(isPastCutoff(daysAgo(15), NOW, 14)).toBe(true)
    expect(isPastCutoff(daysAgo(14), NOW, 14)).toBe(false)
  })
})

describe('notification eligibility', () => {
  it('drops read rows on the short window and unread rows on the long window', () => {
    expect(
      isNotificationEligibleForDelete(
        { readAt: daysAgo(15), createdAt: daysAgo(20) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(true)
    expect(
      isNotificationEligibleForDelete(
        { readAt: daysAgo(3), createdAt: daysAgo(20) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(false)
    expect(
      isNotificationEligibleForDelete(
        { readAt: null, createdAt: daysAgo(91) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(true)
    expect(
      isNotificationEligibleForDelete(
        { readAt: null, createdAt: daysAgo(20) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(false)
  })

  it('uses the simulated telemetry window when marked', () => {
    expect(
      isNotificationEligibleForDelete(
        { readAt: null, createdAt: daysAgo(15), simulated: true },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(true)
  })
})

describe('friend request eligibility', () => {
  it('never deletes pending requests and ages closed ones from respondedAt', () => {
    expect(
      isClosedFriendRequestEligibleForDelete(
        { status: 'pending', createdAt: daysAgo(400), respondedAt: null },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(false)
    expect(
      isClosedFriendRequestEligibleForDelete(
        { status: 'rejected', createdAt: daysAgo(40), respondedAt: daysAgo(31) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(true)
    expect(
      isClosedFriendRequestEligibleForDelete(
        { status: 'accepted', createdAt: daysAgo(40), respondedAt: daysAgo(10) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(false)
  })
})

describe('storage headroom', () => {
  it('treats current ~33MB usage as ok against the 512MB Free cap', () => {
    const headroom = evaluateStorageHeadroom(34_471_936)
    expect(headroom.limitBytes).toBe(NEON_FREE_BRANCH_LIMIT_BYTES)
    expect(headroom.status).toBe('ok')
    expect(headroom.usedRatio).toBeLessThan(STORAGE_WARN_RATIO)
  })

  it('warns at 40% and goes critical at 70%', () => {
    expect(evaluateStorageHeadroom(NEON_FREE_BRANCH_LIMIT_BYTES * STORAGE_WARN_RATIO).status).toBe('warn')
    expect(evaluateStorageHeadroom(NEON_FREE_BRANCH_LIMIT_BYTES * STORAGE_CRITICAL_RATIO).status).toBe(
      'critical'
    )
  })
})

describe('archive object keys', () => {
  it('partitions JSONL dumps by kind, year, month, and owner', () => {
    expect(
      archiveObjectKey('ai-thread', {
        at: NOW,
        userId: 'user-1',
        id: 'thread-9',
      })
    ).toBe('archives/ai-thread/2026/09/user-1/thread-9.jsonl')
  })
})
