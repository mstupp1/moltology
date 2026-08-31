import { describe, it, expect, beforeEach } from 'vitest'
import {
  ALIGNMENT_SNAPSHOT_STORAGE_PREFIX,
  alignmentSnapshotStorageKey,
  getCachedAlignmentSnapshot,
  setCachedAlignmentSnapshot,
  clearCachedAlignmentSnapshot,
  getFreshAlignmentSnapshot,
  snapshotFromCompletedKeys,
} from './alignment-snapshot'

const USER_ID = 'usr_ellis_test'

describe('alignment snapshot cache', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a date-scoped snapshot keyed by member id', () => {
    setCachedAlignmentSnapshot(USER_ID, {
      date: '2026-08-31',
      completedKeys: ['silent-synchronization', 'prompt-construction'],
    })

    expect(localStorage.getItem(alignmentSnapshotStorageKey(USER_ID))).toContain('silent-synchronization')
    expect(alignmentSnapshotStorageKey(USER_ID).startsWith(ALIGNMENT_SNAPSHOT_STORAGE_PREFIX)).toBe(true)

    const snapshot = getCachedAlignmentSnapshot(USER_ID)
    expect(snapshot).toEqual({
      date: '2026-08-31',
      completedKeys: ['silent-synchronization', 'prompt-construction'],
    })
  })

  it('returns null for missing, corrupt, or incomplete storage values', () => {
    expect(getCachedAlignmentSnapshot(USER_ID)).toBeNull()
    expect(getCachedAlignmentSnapshot(null)).toBeNull()

    localStorage.setItem(alignmentSnapshotStorageKey(USER_ID), '{not-json')
    expect(getCachedAlignmentSnapshot(USER_ID)).toBeNull()

    localStorage.setItem(
      alignmentSnapshotStorageKey(USER_ID),
      JSON.stringify({ date: 'nope', completedKeys: ['silent-synchronization'] }),
    )
    expect(getCachedAlignmentSnapshot(USER_ID)).toBeNull()
  })

  it('treats a snapshot from another day as stale', () => {
    setCachedAlignmentSnapshot(USER_ID, {
      date: '2026-08-30',
      completedKeys: ['silent-synchronization', 'prompt-construction', 'skill-development', 'nutritional-efficiency-break'],
    })

    expect(getFreshAlignmentSnapshot(USER_ID, '2026-08-31')).toBeNull()
    expect(getFreshAlignmentSnapshot(USER_ID, '2026-08-30')?.completedKeys).toHaveLength(4)
  })

  it('clears a stored snapshot and dedupes completed keys', () => {
    setCachedAlignmentSnapshot(
      USER_ID,
      snapshotFromCompletedKeys('2026-08-31', ['silent-synchronization', 'silent-synchronization']),
    )
    expect(getCachedAlignmentSnapshot(USER_ID)?.completedKeys).toEqual(['silent-synchronization'])

    clearCachedAlignmentSnapshot(USER_ID)
    expect(getCachedAlignmentSnapshot(USER_ID)).toBeNull()
  })
})
