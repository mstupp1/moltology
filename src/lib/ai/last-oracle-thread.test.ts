import { describe, it, expect } from 'vitest'
import {
  pickLastActiveOracleThread,
  parseOracleThreadSearch,
  validateOracleSearch,
  threadTimestampMs,
} from './last-oracle-thread'

describe('pickLastActiveOracleThread', () => {
  it('returns null when there is nothing to continue', () => {
    expect(pickLastActiveOracleThread(undefined)).toBeNull()
    expect(pickLastActiveOracleThread([])).toBeNull()
    expect(
      pickLastActiveOracleThread([
        { id: 'archived', archivedAt: '2026-08-29T12:00:00.000Z', updatedAt: '2026-08-30T12:00:00.000Z' },
      ]),
    ).toBeNull()
  })

  it('selects the most recently updated thread, not a pinned older one', () => {
    const last = pickLastActiveOracleThread([
      {
        id: 'pinned-old',
        title: 'Pinned Doctrine',
        pinnedAt: '2026-08-30T18:00:00.000Z',
        updatedAt: '2026-08-20T09:00:00.000Z',
      },
      {
        id: 'fresh',
        title: 'Last live consultation',
        updatedAt: '2026-08-30T16:00:00.000Z',
      },
      {
        id: 'older',
        title: 'Yesterday',
        updatedAt: '2026-08-29T16:00:00.000Z',
      },
    ] as Array<{ id: string; title: string; pinnedAt?: string; updatedAt: string }>)

    expect(last?.id).toBe('fresh')
  })

  it('ignores archived threads even when they were updated last', () => {
    const last = pickLastActiveOracleThread([
      {
        id: 'archived-latest',
        archivedAt: '2026-08-30T18:00:00.000Z',
        updatedAt: '2026-08-30T18:00:00.000Z',
      },
      {
        id: 'open',
        updatedAt: '2026-08-28T12:00:00.000Z',
      },
    ])

    expect(last?.id).toBe('open')
  })

  it('falls back to createdAt when updatedAt is missing', () => {
    const last = pickLastActiveOracleThread([
      { id: 'no-dates' },
      { id: 'created-later', createdAt: '2026-08-30T10:00:00.000Z' },
    ])

    expect(last?.id).toBe('created-later')
  })
})

describe('Oracle thread search', () => {
  it('accepts a non-empty thread id and ignores junk', () => {
    expect(parseOracleThreadSearch({ thread: ' thread-1 ' })).toBe('thread-1')
    expect(parseOracleThreadSearch({ thread: '' })).toBeUndefined()
    expect(parseOracleThreadSearch({ thread: 12 })).toBeUndefined()
    expect(parseOracleThreadSearch({})).toBeUndefined()
    expect(validateOracleSearch({ thread: 'abc' })).toEqual({ thread: 'abc' })
    expect(validateOracleSearch({ thread: '   ' })).toEqual({})
  })

  it('treats invalid timestamps as zero so a dated thread still wins', () => {
    expect(threadTimestampMs('not-a-date')).toBe(0)
    expect(threadTimestampMs(new Date('2026-08-30T00:00:00.000Z'))).toBe(
      Date.parse('2026-08-30T00:00:00.000Z'),
    )
  })
})
