import { stripControlChars } from './content-safety'

export const SUPPORT_INBOX = 'support@moltology.org'

export const SUPPORT_TICKET_SUBJECT_MIN = 3
export const SUPPORT_TICKET_SUBJECT_MAX = 160
export const SUPPORT_TICKET_BODY_MIN = 10
export const SUPPORT_TICKET_BODY_MAX = 4000

export const SUPPORT_TICKET_MEMBER_LIMIT = 3
export const SUPPORT_TICKET_IP_LIMIT = 8
export const SUPPORT_TICKET_RATE_WINDOW_MS = 15 * 60 * 1000

export const SUPPORT_TICKET_HONEYPOT_FIELD = 'molt_bait_field'
export const SUPPORT_TICKET_TURNSTILE_ACTION = 'support_ticket'

export const SUPPORT_TICKET_CATEGORIES = [
  'SHELL_INTEGRITY',
  'SESSION_CLEARANCE',
  'MARKET_CREDITS',
  'OTHER',
] as const

export const SUPPORT_TICKET_URGENCIES = ['NORMAL', 'HIGH', 'CRITICAL'] as const

export type SupportTicketCategoryId = (typeof SUPPORT_TICKET_CATEGORIES)[number]
export type SupportTicketUrgencyId = (typeof SUPPORT_TICKET_URGENCIES)[number]

export const SUPPORT_TICKET_COPY = {
  formTitle: 'Transmit a support ticket',
  formHint: 'A steward reads every ticket that lands in the Benthic Core channel.',
  subjectLabel: 'Symptom',
  subjectPlaceholder: 'Carapace torque synchronization latency',
  categoryLabel: 'Channel',
  urgencyLabel: 'Pressure',
  bodyLabel: 'What happened',
  bodyPlaceholder: 'Describe the issue. Paste any error readout that helps a steward find it.',
  submit: 'Dispatch ticket',
  submitting: 'Dispatching',
  successTitle: 'Transmission received',
  successBody: (ref: string) =>
    `The Benthic Core has your ticket. Reference ${ref}. A steward will read it from the support channel.`,
  guestTitle: 'Ticket channel sealed',
  guestBody:
    'Sign in with your initiate account to file a ticket. Guests cannot open a channel from this terminal.',
  guestSignUp: 'Sign up to unlock',
  guestSignIn: 'Already have an account? Sign in',
  rateLimited: 'You already sent a ticket recently. Wait a few minutes and try again.',
  unauthenticated: 'Sign in to file a ticket.',
  genericError: 'Could not send your ticket. Try again in a moment.',
  subjectRequired: 'Add a short subject.',
  bodyRequired: 'Describe the issue in a few sentences.',
  bodyTooLong: 'That description is too long. Trim it and try again.',
  botCheckFailed: 'Bot check failed. Refresh the challenge and try again.',
  honeypotLabel: 'Leave this empty',
} as const

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<SupportTicketCategoryId, string> = {
  SHELL_INTEGRITY: 'Shell and chassis',
  SESSION_CLEARANCE: 'Session and clearance',
  MARKET_CREDITS: 'Market and credits',
  OTHER: 'General inquiry',
}

export const SUPPORT_TICKET_URGENCY_LABELS: Record<SupportTicketUrgencyId, string> = {
  NORMAL: 'Steady',
  HIGH: 'High pressure',
  CRITICAL: 'Critical breach',
}

const HTML_TAG = /<[^>]*>?/g

export function sanitizeSupportTicketText(raw: string | null | undefined): string {
  if (!raw) return ''
  return stripControlChars(String(raw).replace(HTML_TAG, '')).trim()
}

export function isSupportTicketCategory(value: string): value is SupportTicketCategoryId {
  return (SUPPORT_TICKET_CATEGORIES as readonly string[]).includes(value)
}

export function isSupportTicketUrgency(value: string): value is SupportTicketUrgencyId {
  return (SUPPORT_TICKET_URGENCIES as readonly string[]).includes(value)
}

export function parseSupportTicketCategory(value: string | null | undefined): SupportTicketCategoryId {
  const next = (value || '').trim().toUpperCase()
  return isSupportTicketCategory(next) ? next : 'OTHER'
}

export function parseSupportTicketUrgency(value: string | null | undefined): SupportTicketUrgencyId {
  const next = (value || '').trim().toUpperCase()
  return isSupportTicketUrgency(next) ? next : 'NORMAL'
}

export function isSupportTicketHoneypotTriggered(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function formatSupportTicketReference(ticketId: string): string {
  return ticketId.trim()
}

export function validateSupportTicketFields(input: {
  subject: string
  body: string
}): { ok: true; subject: string; body: string } | { ok: false; error: string } {
  const subject = sanitizeSupportTicketText(input.subject)
  const body = sanitizeSupportTicketText(input.body)

  if (subject.length < SUPPORT_TICKET_SUBJECT_MIN) {
    return { ok: false, error: SUPPORT_TICKET_COPY.subjectRequired }
  }
  if (subject.length > SUPPORT_TICKET_SUBJECT_MAX) {
    return { ok: false, error: SUPPORT_TICKET_COPY.subjectRequired }
  }
  if (body.length < SUPPORT_TICKET_BODY_MIN) {
    return { ok: false, error: SUPPORT_TICKET_COPY.bodyRequired }
  }
  if (body.length > SUPPORT_TICKET_BODY_MAX) {
    return { ok: false, error: SUPPORT_TICKET_COPY.bodyTooLong }
  }

  return { ok: true, subject, body }
}
