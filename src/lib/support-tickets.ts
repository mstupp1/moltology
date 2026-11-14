import { stripControlChars } from './content-safety'

export const SUPPORT_INBOX = 'support@moltology.org'

export const SUPPORT_TICKET_SUBJECT_MAX = 160
export const SUPPORT_TICKET_BODY_MIN = 10
/** Keeps every message inside Laya's ~1,500 character limit. */
export const SUPPORT_TICKET_BODY_MAX = 1200

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
  formHint: "We'll read every message and reply by email.",
  bodyLabel: "What's going on?",
  bodyPlaceholder: 'What you were doing, what you expected, and any error you saw.',
  counter: (used: number, max: number) => `${used.toLocaleString('en-US')} / ${max.toLocaleString('en-US')}`,
  submit: 'Send',
  submitting: 'Sending',
  successTitle: 'We got your message',
  successBody: (ref: string) =>
    `We got your message. Reference ${ref}. We'll email you when there's an update.`,
  guestTitle: 'Contact support',
  guestBody: "Email us and we'll reply there. Signed-in members can send a message from this page.",
  guestEmail: 'Email support',
  guestSignIn: 'Sign in to send a message',
  rateLimited: 'You already sent a message recently. Wait a few minutes and try again.',
  unauthenticated: 'Sign in to contact support.',
  genericError: 'Could not send your message. Try again in a moment.',
  bodyRequired: 'Describe the issue in a few sentences.',
  bodyTooLong: 'That message is too long. Trim it and try again.',
  botCheckFailed: 'Bot check failed. Refresh the challenge and try again.',
  honeypotLabel: 'Leave this empty',
  toastReceived: 'Your message was received.',
} as const

export const SUPPORT_PAGE_COPY = {
  pageTitle: 'Support',
  tabChangelog: 'Changelog',
  tabContact: 'Contact',
  changelogLive: 'Live',
  changelogEmpty: 'No matching releases',
  changelogEmptyHint: (query: string) => `Nothing matches "${query}".`,
  changelogReset: 'Reset filters',
  changelogExpand: 'View release notes',
  changelogCollapse: 'Hide release notes',
  changelogPermalink: 'Permalink',
  changelogHint: 'Every release, newest first.',
  contactHint: 'Questions about your account, billing, or something that broke.',
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

/** Subject used when the summary model is unavailable: the first few words. */
export function supportTicketFallbackSubject(body: string): string {
  const firstLine = sanitizeSupportTicketText(body).split('\n')[0].replace(/\s+/g, ' ').trim()
  if (firstLine.length <= 60) return firstLine || 'Support message'
  const cut = firstLine.slice(0, 60)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim()}...`
}

export function validateSupportTicketBody(
  input: string,
): { ok: true; body: string } | { ok: false; error: string } {
  const body = sanitizeSupportTicketText(input)

  if (body.length < SUPPORT_TICKET_BODY_MIN) {
    return { ok: false, error: SUPPORT_TICKET_COPY.bodyRequired }
  }
  if (body.length > SUPPORT_TICKET_BODY_MAX) {
    return { ok: false, error: SUPPORT_TICKET_COPY.bodyTooLong }
  }

  return { ok: true, body }
}
