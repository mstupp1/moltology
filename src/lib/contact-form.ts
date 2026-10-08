import { sanitizeSupportTicketText } from './support-tickets'

/** Public contact form on /org. Messages are emailed to SUPPORT_INBOX; nothing is stored. */

export const CONTACT_NAME_MAX = 120
export const CONTACT_MESSAGE_MIN = 10
export const CONTACT_MESSAGE_MAX = 4000

export const CONTACT_IP_LIMIT = 5
export const CONTACT_EMAIL_LIMIT = 3
export const CONTACT_RATE_WINDOW_MS = 15 * 60 * 1000

export const CONTACT_HONEYPOT_FIELD = 'molt_bait_field'
export const CONTACT_TURNSTILE_ACTION = 'org_contact'

export const CONTACT_TOPICS = ['general', 'careers', 'visit', 'press', 'other'] as const
export type ContactTopicId = (typeof CONTACT_TOPICS)[number]

export const CONTACT_TOPIC_LABELS: Record<ContactTopicId, string> = {
  general: 'General question',
  careers: 'Careers',
  visit: 'Visiting the lair',
  press: 'Press & partnerships',
  other: 'Something else',
}

export const CONTACT_COPY = {
  nameRequired: 'Add your name.',
  nameTooLong: `Name must be ${CONTACT_NAME_MAX} characters or fewer.`,
  emailRequired: 'Enter a valid email address.',
  messageRequired: `Message must be at least ${CONTACT_MESSAGE_MIN} characters.`,
  messageTooLong: `Message must be ${CONTACT_MESSAGE_MAX} characters or fewer.`,
  rateLimited: 'You sent a few messages already. Wait a few minutes and try again.',
  botCheckFailed: 'Bot check failed. Refresh the challenge and try again.',
  genericError: 'Could not send your message. Please try again.',
  toastSent: 'Message sent.',
} as const

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseContactTopic(value: string | null | undefined): ContactTopicId {
  const next = (value || '').trim().toLowerCase()
  return (CONTACT_TOPICS as readonly string[]).includes(next) ? (next as ContactTopicId) : 'general'
}

export function contactTopicLabel(value: string | null | undefined): string {
  return CONTACT_TOPIC_LABELS[parseContactTopic(value)]
}

export function isContactHoneypotTriggered(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0)
}

export function validateContactFields(input: {
  name: string
  email: string
  message: string
}):
  | { ok: true; name: string; email: string; message: string }
  | { ok: false; error: string } {
  // Strip line breaks from the name so it can't break the email subject line.
  const name = sanitizeSupportTicketText(input.name).replace(/\s+/g, ' ')
  const email = (input.email || '').trim().toLowerCase()
  const message = sanitizeSupportTicketText(input.message)

  if (!name) return { ok: false, error: CONTACT_COPY.nameRequired }
  if (name.length > CONTACT_NAME_MAX) return { ok: false, error: CONTACT_COPY.nameTooLong }
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return { ok: false, error: CONTACT_COPY.emailRequired }
  }
  if (message.length < CONTACT_MESSAGE_MIN) return { ok: false, error: CONTACT_COPY.messageRequired }
  if (message.length > CONTACT_MESSAGE_MAX) return { ok: false, error: CONTACT_COPY.messageTooLong }

  return { ok: true, name, email, message }
}
