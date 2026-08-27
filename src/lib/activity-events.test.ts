import { describe, it, expect } from 'vitest'
import { CANONICAL_ALIGNMENT_TASKS } from './alignment-tasks'
import {
  ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
  ACTIVITY_STREAM_EMPTY_COPY,
  ACTIVITY_STREAM_SUBTITLE,
  buildRoutineCompletedCopy,
  formatActivityAge,
  routineActivitySourceKey,
  toActivityEventView,
} from './activity-events'

describe('activity event copy and mapping', () => {
  it('builds an idempotent source key from liturgy identity and date', () => {
    expect(routineActivitySourceKey('silent-synchronization', '2026-08-27')).toBe(
      'routine:silent-synchronization:2026-08-27'
    )
  })

  it('describes a sealed liturgy without inventing credits, fathoms, or torque', () => {
    const task = CANONICAL_ALIGNMENT_TASKS.find((t) => t.key === 'silent-synchronization')
    expect(task).toBeDefined()
    const copy = buildRoutineCompletedCopy(task!)
    expect(copy.kind).toBe(ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED)
    expect(copy.title).toBe('Silent Synchronization sealed')
    expect(copy.detail).toBe('The 05:30 liturgy is complete.')
    expect(copy.valueBadge).toBe('05:30')
    const blob = `${copy.title} ${copy.detail} ${copy.valueBadge}`
    expect(blob).not.toMatch(/luxury sedan/i)
    expect(blob).not.toMatch(/\+450/)
    expect(blob).not.toMatch(/3,?400/)
    expect(blob).not.toMatch(/MC\b/)
    expect(blob).not.toMatch(/fathom/i)
    expect(blob).not.toMatch(/torque/i)
    expect(blob).not.toContain('//')
  })

  it('keeps empty-state copy in-world, warm, and free of help-desk phrasing', () => {
    expect(ACTIVITY_STREAM_EMPTY_COPY.title).toBe('The stream is still')
    expect(ACTIVITY_STREAM_EMPTY_COPY.body).toMatch(/liturgy/)
    expect(ACTIVITY_STREAM_EMPTY_COPY.body).not.toMatch(/no activity yet/i)
    expect(ACTIVITY_STREAM_SUBTITLE).not.toContain('//')
    expect(`${ACTIVITY_STREAM_EMPTY_COPY.title} ${ACTIVITY_STREAM_EMPTY_COPY.body}`).not.toContain('//')
  })

  it('formats relative ages from a frozen now', () => {
    const now = new Date('2026-08-27T18:00:00.000Z')
    expect(formatActivityAge(new Date('2026-08-27T17:59:40.000Z'), now)).toBe('just now')
    expect(formatActivityAge(new Date('2026-08-27T17:59:00.000Z'), now)).toBe('1 minute ago')
    expect(formatActivityAge(new Date('2026-08-27T17:14:00.000Z'), now)).toBe('46 minutes ago')
    expect(formatActivityAge(new Date('2026-08-27T17:00:00.000Z'), now)).toBe('1 hour ago')
    expect(formatActivityAge(new Date('2026-08-27T12:00:00.000Z'), now)).toBe('6 hours ago')
    expect(formatActivityAge(new Date('2026-08-26T18:00:00.000Z'), now)).toBe('yesterday')
    expect(formatActivityAge(new Date('2026-08-24T18:00:00.000Z'), now)).toBe('3 days ago')
  })

  it('maps a stored row into a dashboard view without canned veteran proof', () => {
    const now = new Date('2026-08-27T18:00:00.000Z')
    const view = toActivityEventView(
      {
        id: 'evt-1',
        kind: ACTIVITY_EVENT_KIND_ROUTINE_COMPLETED,
        title: 'Silent Synchronization sealed',
        detail: 'The 05:30 liturgy is complete.',
        valueBadge: '05:30',
        createdAt: new Date('2026-08-27T17:46:00.000Z'),
      },
      now
    )
    expect(view.category).toBe('ROUTINES')
    expect(view.occurredLabel).toBe('14 minutes ago')
    expect(view.occurredAt).toBe('2026-08-27T17:46:00.000Z')
  })
})
