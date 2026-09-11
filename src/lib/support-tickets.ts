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
  'ACCOUNT',
  'BILLING',
  'BUG',
  'OTHER',
] as const

export const SUPPORT_TICKET_URGENCIES = ['NORMAL', 'HIGH', 'URGENT'] as const

export type SupportTicketCategoryId = (typeof SUPPORT_TICKET_CATEGORIES)[number]
export type SupportTicketUrgencyId = (typeof SUPPORT_TICKET_URGENCIES)[number]

export const SUPPORT_TICKET_COPY = {
  formTitle: 'Contact support',
  formHint: "We'll read every ticket and reply by email.",
  subjectLabel: 'Subject',
  subjectPlaceholder: 'Brief summary of the issue',
  categoryLabel: 'Topic',
  urgencyLabel: 'Priority',
  bodyLabel: 'Tell us what happened',
  bodyPlaceholder: 'What you were doing, what you expected, and any error you saw.',
  submit: 'Send',
  submitting: 'Sending',
  successTitle: 'We got your ticket',
  successBody: (ref: string) =>
    `We got your ticket. Reference ${ref}. We'll email you when there's an update.`,
  guestTitle: 'Sign in to contact support',
  guestBody: "Create a free account or sign in. We'll reply by email.",
  guestSignUp: 'Sign up',
  guestSignIn: 'Already have an account? Sign in',
  rateLimited: 'You already sent a ticket recently. Wait a few minutes and try again.',
  unauthenticated: 'Sign in to contact support.',
  genericError: 'Could not send your ticket. Try again in a moment.',
  subjectRequired: 'Add a short subject.',
  bodyRequired: 'Describe the issue in a few sentences.',
  bodyTooLong: 'That description is too long. Trim it and try again.',
  botCheckFailed: 'Bot check failed. Refresh the challenge and try again.',
  honeypotLabel: 'Leave this empty',
  toastReceived: 'Your ticket was received.',
} as const

export const SUPPORT_TICKET_CATEGORY_LABELS: Record<SupportTicketCategoryId, string> = {
  ACCOUNT: 'Account & sign-in',
  BILLING: 'Billing & purchases',
  BUG: "Something's broken",
  OTHER: 'Something else',
}

export const SUPPORT_TICKET_URGENCY_LABELS: Record<SupportTicketUrgencyId, string> = {
  NORMAL: 'Normal',
  HIGH: 'High',
  URGENT: 'Urgent',
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
  if (next === 'CRITICAL') return 'URGENT'
  return isSupportTicketUrgency(next) ? next : 'NORMAL'
}

export function supportTicketCategoryLabel(value: string | null | undefined): string {
  return SUPPORT_TICKET_CATEGORY_LABELS[parseSupportTicketCategory(value)]
}

export function supportTicketUrgencyLabel(value: string | null | undefined): string {
  return SUPPORT_TICKET_URGENCY_LABELS[parseSupportTicketUrgency(value)]
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
