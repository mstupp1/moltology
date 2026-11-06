import { beforeEach, describe, expect, it } from 'vitest'
import { MOLTMAX_QUESTIONS } from './moltmax-quiz'
import { CANONICAL_ALIGNMENT_TASKS } from './alignment-tasks'
import {
  GUEST_AUDIT_MAX_AGE_MS,
  GUEST_PROGRESS_STORAGE_KEY,
  clearGuestAlignment,
  clearGuestAudit,
  guestAlignmentFor,
  parseGuestProgress,
  readGuestProgress,
  requestGuestAuditSave,
  saveGuestAlignment,
  saveGuestAudit,
} from './guest-progress'

const fullAnswers = Object.fromEntries(MOLTMAX_QUESTIONS.map((q) => [q.id, q.options[0].id]))

describe('guest progress', () => {
  beforeEach(() => localStorage.clear())

  it('keeps a finished audit and marks a save request', () => {
    saveGuestAudit(fullAnswers, { now: 1_000 })
    expect(readGuestProgress(2_000).audit).toEqual({ answers: fullAnswers, completedAt: 1_000, saveRequested: false })
    requestGuestAuditSave(2_000)
    expect(readGuestProgress(2_000).audit?.saveRequested).toBe(true)
  })

  it('drops unfinished, unknown and stale audits', () => {
    const [first] = MOLTMAX_QUESTIONS
    saveGuestAudit({ [first.id]: 'a' })
    expect(readGuestProgress().audit).toBeUndefined()

    saveGuestAudit({ ...fullAnswers, extra: 'x' }, { now: 1_000 })
    expect(Object.keys(readGuestProgress(1_000).audit?.answers ?? {})).toHaveLength(MOLTMAX_QUESTIONS.length)
    expect(readGuestProgress(1_000 + GUEST_AUDIT_MAX_AGE_MS + 1).audit).toBeUndefined()
  })

  it('keeps alignment ticks for their own day only, and only real task keys', () => {
    const [a, b] = CANONICAL_ALIGNMENT_TASKS.map((t) => t.key)
    saveGuestAlignment('2026-11-06', [a, b, a, 'not-a-task'])
    expect(guestAlignmentFor('2026-11-06')).toEqual([a, b])
    expect(guestAlignmentFor('2026-11-07')).toEqual([])
  })

  it('clears each part on its own and removes the key when empty', () => {
    saveGuestAudit(fullAnswers)
    saveGuestAlignment('2026-11-06', [CANONICAL_ALIGNMENT_TASKS[0].key])
    clearGuestAudit()
    expect(readGuestProgress().audit).toBeUndefined()
    expect(readGuestProgress().alignment).toBeDefined()
    clearGuestAlignment()
    expect(localStorage.getItem(GUEST_PROGRESS_STORAGE_KEY)).toBeNull()
  })

  it('treats malformed storage as empty', () => {
    expect(parseGuestProgress('not json')).toEqual({})
    expect(parseGuestProgress(JSON.stringify({ audit: 'x', alignment: { date: 'today' } }))).toEqual({})
  })
})
