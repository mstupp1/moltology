/**
 * Forum peer-flag helpers. Soft report rows only — never mutate the flagged body.
 * Stewards review open rows at /watch (query: forum_reports where status = 'open').
 */

import { isForumEntryWithdrawn } from './forum-utils'

export const FORUM_REPORT_NOTE_MAX = 400

export const FORUM_REPORT_REASONS = [
  'surface_noise',
  'unkind_current',
  'soft_shell_harm',
  'safety_breach',
  'other',
] as const

export type ForumReportReason = (typeof FORUM_REPORT_REASONS)[number]

export interface ForumReportReasonOption {
  id: ForumReportReason
  label: string
  description: string
}

export const FORUM_REPORT_REASON_OPTIONS: ForumReportReasonOption[] = [
  {
    id: 'surface_noise',
    label: 'Surface noise',
    description: 'Spam, flooding, or empty promo that drowns the board.',
  },
  {
    id: 'unkind_current',
    label: 'Unkind current',
    description: 'A personal attack, or a grip aimed at a person instead of the work.',
  },
  {
    id: 'soft_shell_harm',
    label: 'Soft-shell harm',
    description: 'A newly molted member is being mocked, pressed, or left unguarded.',
  },
  {
    id: 'safety_breach',
    label: 'Safety breach',
    description: 'Real-world harm, illegal asks, or anything that cages instead of protects.',
  },
  {
    id: 'other',
    label: 'Something else',
    description: 'A short note if none of the above names it. Keep it kind and specific.',
  },
]

export const FORUM_REPORT_COPY = {
  flagAction: 'Flag',
  dialogTitle: 'Flag this transmission',
  dialogLead: 'A steward will read this quietly. Nothing appears on the thread.',
  noteLabel: 'Optional note',
  notePlaceholder: 'Keep it short and kind.',
  cancel: 'Keep reading',
  submit: 'Send flag',
  submitting: 'Sending...',
  reasonRequired: 'Choose a reason.',
  noteTooLong: `Note must be ${FORUM_REPORT_NOTE_MAX} characters or fewer.`,
  toastReceived: 'Flag received. A steward will review this quietly.',
  toastAlready: 'This flag is already with the stewards.',
  toastError: 'Could not send that flag. Please try again.',
  ownTarget: 'You cannot flag your own transmission.',
  withdrawnTarget: 'That transmission was already withdrawn.',
  missingTarget: 'That transmission is no longer available.',
  watchSealed: 'This ledger is sealed.',
  watchEmpty: 'The deep is quiet. No open flags.',
} as const

export function isForumReportReason(value: string | null | undefined): value is ForumReportReason {
  return Boolean(value && (FORUM_REPORT_REASONS as readonly string[]).includes(value))
}

export function forumReportReasonLabel(reason: string): string {
  return FORUM_REPORT_REASON_OPTIONS.find((option) => option.id === reason)?.label ?? reason
}

export function normalizeForumReportNote(note: string | null | undefined): string | null {
  if (note == null) return null
  const trimmed = note.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function validateForumReportInput(input: {
  reason?: string | null
  note?: string | null
}): { valid: true; reason: ForumReportReason; note: string | null } | { valid: false; error: string } {
  const reason = input.reason
  if (!isForumReportReason(reason)) {
    return { valid: false, error: FORUM_REPORT_COPY.reasonRequired }
  }
  const note = normalizeForumReportNote(input.note)
  if (note && note.length > FORUM_REPORT_NOTE_MAX) {
    return { valid: false, error: FORUM_REPORT_COPY.noteTooLong }
  }
  return { valid: true, reason, note }
}

export function canFlagForumTarget(opts: {
  viewerId?: string | null
  authorId?: string | null
  withdrawn?: boolean
  deletedAt?: string | Date | null
}): boolean {
  if (!opts.viewerId) return false
  if (opts.withdrawn || isForumEntryWithdrawn({ deletedAt: opts.deletedAt })) return false
  if (opts.authorId && opts.viewerId === opts.authorId) return false
  return true
}
