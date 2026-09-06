import { describe, expect, it } from 'vitest'
import {
  FORUM_REPORT_COPY,
  FORUM_REPORT_NOTE_MAX,
  canFlagForumTarget,
  forumReportReasonLabel,
  isForumReportReason,
  normalizeForumReportNote,
  validateForumReportInput,
} from './forum-reports'

describe('forum report helpers', () => {
  it('accepts preset reasons and rejects unknown ones', () => {
    expect(isForumReportReason('surface_noise')).toBe(true)
    expect(isForumReportReason('toxicity')).toBe(false)
    expect(forumReportReasonLabel('soft_shell_harm')).toBe('Soft-shell harm')
    expect(forumReportReasonLabel('unknown')).toBe('unknown')
  })

  it('requires a preset and caps the optional note', () => {
    expect(validateForumReportInput({ reason: 'nope' })).toEqual({
      valid: false,
      error: FORUM_REPORT_COPY.reasonRequired,
    })
    expect(validateForumReportInput({ reason: 'other', note: '   ' })).toEqual({
      valid: true,
      reason: 'other',
      note: null,
    })
    expect(
      validateForumReportInput({
        reason: 'other',
        note: 'x'.repeat(FORUM_REPORT_NOTE_MAX + 1),
      }),
    ).toEqual({
      valid: false,
      error: FORUM_REPORT_COPY.noteTooLong,
    })
    expect(normalizeForumReportNote('  keep the deep warm  ')).toBe('keep the deep warm')
  })

  it('hides the flag on guests, authors, and withdrawn transmissions', () => {
    expect(canFlagForumTarget({ viewerId: null, authorId: 'a' })).toBe(false)
    expect(canFlagForumTarget({ viewerId: 'a', authorId: 'a' })).toBe(false)
    expect(canFlagForumTarget({ viewerId: 'b', authorId: 'a', withdrawn: true })).toBe(false)
    expect(
      canFlagForumTarget({
        viewerId: 'b',
        authorId: 'a',
        deletedAt: '2026-09-06T02:00:00.000Z',
      }),
    ).toBe(false)
    expect(canFlagForumTarget({ viewerId: 'b', authorId: 'a' })).toBe(true)
    expect(canFlagForumTarget({ viewerId: 'b', authorId: null })).toBe(true)
  })
})
