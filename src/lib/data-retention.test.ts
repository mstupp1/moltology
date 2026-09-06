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
  isAiMessageEligibleForArchive,
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

  it('keeps lean windows strictly shorter than lenient on every knob', () => {
    for (const key of Object.keys(LEAN_WINDOWS) as Array<keyof typeof LEAN_WINDOWS>) {
      expect(LEAN_WINDOWS[key]).toBeLessThan(LENIENT_WINDOWS[key])
    }
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
    expect(byTable.ai_messages.retentionClass).toBe('hot-summarize-archive-delete')
    expect(byTable.ai_messages.archiveAfterDays).toBe(90)
    expect(byTable.profiles.hotDays).toBeNull()
    expect(byTable.forum_posts.hotDays).toBeNull()
    expect(byTable.blog_posts.hotDays).toBeNull()
    expect(byTable.leads.retentionClass).toBe('legal')
  })

  it('lengthens Oracle and heatmap windows under the lenient overlay', () => {
    const lean = Object.fromEntries(buildTablePolicies(LEAN_WINDOWS).map((policy) => [policy.table, policy]))
    const lenient = Object.fromEntries(buildTablePolicies(LENIENT_WINDOWS).map((policy) => [policy.table, policy]))
    expect(lenient.ai_messages.hotDays).toBeGreaterThan(lean.ai_messages.hotDays ?? 0)
    expect(lenient.routine_completions.deleteAfterDays).toBe(1095)
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

describe('oracle archive eligibility', () => {
  it('keeps pinned threads hot even when old', () => {
    expect(
      isAiMessageEligibleForArchive(
        { createdAt: daysAgo(400), threadPinned: true, threadArchivedAt: daysAgo(400) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(false)
  })

  it('archives aged unpinned threads and aged user-archived threads', () => {
    expect(
      isAiMessageEligibleForArchive(
        { createdAt: daysAgo(91), threadPinned: false, threadArchivedAt: null },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(true)
    expect(
      isAiMessageEligibleForArchive(
        { createdAt: daysAgo(5), threadPinned: false, threadArchivedAt: daysAgo(91) },
        NOW,
        LEAN_WINDOWS
      )
    ).toBe(true)
    expect(
      isAiMessageEligibleForArchive(
        { createdAt: daysAgo(10), threadPinned: false, threadArchivedAt: null },
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
