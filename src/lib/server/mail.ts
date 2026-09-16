import {
  EMAIL_VERIFICATION_MAIL,
  renderEmailVerificationEmailHtml,
} from '../../emails/email-verification'
import { env } from '../../env'
import {
  SUPPORT_INBOX,
  supportTicketCategoryLabel,
  supportTicketUrgencyLabel,
} from '../support-tickets'

export const RESEND_EMAILS_URL = 'https://api.resend.com/emails'

export const DEFAULT_SUPPORT_FROM = 'Moltology <noreply@moltology.org>'

export interface SupportTicketMailInput {
  ticketId: string
  memberId: string
  handle: string | null
  memberEmail?: string | null
  subject: string
  body: string
  category: string
  urgency: string
  /** Ignored. Recipient is always SUPPORT_INBOX. */
  to?: string
  recipient?: string
}

export interface SupportTicketMailResult {
  sent: boolean
  skipped?: boolean
  error?: string
}

export interface TransactionalMailInput {
  to: string
  subject: string
  text: string
  html?: string
  replyTo?: string
}

export type TransactionalMailResult = SupportTicketMailResult

export interface EmailVerificationMailInput {
  to: string
  url: string
}

export function renderSupportTicketEmailText(input: SupportTicketMailInput): string {
  const handle = input.handle?.trim() || '(unclaimed)'
  const memberEmail = input.memberEmail?.trim() || '(not on session)'
  return [
    'Support ticket received',
    '',
    `Ticket: ${input.ticketId}`,
    `Member id: ${input.memberId}`,
    `Handle: ${handle}`,
    `Member email: ${memberEmail}`,
    `Topic: ${supportTicketCategoryLabel(input.category)}`,
    `Priority: ${supportTicketUrgencyLabel(input.urgency)}`,
    '',
    `Subject: ${input.subject}`,
    '',
    input.body,
  ].join('\n')
}

export function renderEmailVerificationText(input: EmailVerificationMailInput): string {
  return [
    EMAIL_VERIFICATION_MAIL.heading,
    '',
    EMAIL_VERIFICATION_MAIL.body,
    input.url,
    '',
    EMAIL_VERIFICATION_MAIL.ignore,
  ].join('\n')
}

export async function renderEmailVerificationHtml(
  input: EmailVerificationMailInput,
): Promise<string> {
  return renderEmailVerificationEmailHtml(input.url)
}

function resolveResendApiKey(): string | undefined {
  if (process.env.RESEND_API_KEY !== undefined) {
    return process.env.RESEND_API_KEY || undefined
  }
  return env.RESEND_API_KEY || undefined
}

function resolveFromAddress(): string {
  if (process.env.RESEND_FROM_EMAIL !== undefined) {
    return process.env.RESEND_FROM_EMAIL || DEFAULT_SUPPORT_FROM
  }
  return env.RESEND_FROM_EMAIL || DEFAULT_SUPPORT_FROM
}

/**
 * Low-level Resend send. Used by support tickets and transactional auth mail.
 * Missing API key skips without throwing.
 */
export async function sendTransactionalEmail(
  input: TransactionalMailInput,
): Promise<TransactionalMailResult> {
  const apiKey = resolveResendApiKey()
  if (!apiKey) {
    console.warn('[mail] RESEND_API_KEY missing; email skipped.')
    return { sent: false, skipped: true, error: 'missing-api-key' }
  }

  const payload: Record<string, unknown> = {
    from: resolveFromAddress(),
    to: [input.to],
    subject: input.subject,
    text: input.text,
  }
  if (input.html) payload.html = input.html
  if (input.replyTo) payload.reply_to = input.replyTo

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('[mail] Resend rejected email:', response.status, detail)
      return { sent: false, error: `http-${response.status}` }
    }

    return { sent: true }
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'AbortError') {
      console.error('[mail] Resend timed out sending email.')
      return { sent: false, error: 'timeout' }
    }
    console.error('[mail] Failed to send email:', error)
    return { sent: false, error: 'network' }
  }
}

/**
 * Sends the intake notification to support@moltology.org only.
 * Form-chosen `to` / `recipient` values are discarded.
 */
export async function sendSupportTicketEmail(
  input: SupportTicketMailInput,
): Promise<SupportTicketMailResult> {
  return sendTransactionalEmail({
    to: SUPPORT_INBOX,
    subject: `[Ticket ${input.ticketId}] ${input.subject}`,
    text: renderSupportTicketEmailText(input),
    replyTo: input.memberEmail?.trim() || undefined,
  })
}

/**
 * Transactional email-verification message for Better Auth.
 * HTML render failures fall back to plain text so Resend still receives a send.
 * Delivery failures are returned to the caller; auth-server throws when unsent.
 */
export async function sendEmailVerificationEmail(
  input: EmailVerificationMailInput,
): Promise<TransactionalMailResult> {
  console.info('[mail] verification send', { hasResendKey: Boolean(resolveResendApiKey()) })

  let html: string | undefined
  try {
    html = await renderEmailVerificationHtml(input)
  } catch (error) {
    console.error('[mail] Failed to render verification email HTML; sending text only.', error)
  }

  return sendTransactionalEmail({
    to: input.to,
    subject: EMAIL_VERIFICATION_MAIL.subject,
    text: renderEmailVerificationText(input),
    html,
  })
}
