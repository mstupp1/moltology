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

function resolveResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY || env.RESEND_API_KEY || undefined
}

function resolveFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL || env.RESEND_FROM_EMAIL || DEFAULT_SUPPORT_FROM
}

/**
 * Sends the intake notification to support@moltology.org only.
 * Form-chosen `to` / `recipient` values are discarded.
 */
export async function sendSupportTicketEmail(
  input: SupportTicketMailInput,
): Promise<SupportTicketMailResult> {
  const apiKey = resolveResendApiKey()
  if (!apiKey) {
    console.warn('[mail] RESEND_API_KEY missing; ticket persisted without email.')
    return { sent: false, skipped: true, error: 'missing-api-key' }
  }

  const payload = {
    from: resolveFromAddress(),
    to: [SUPPORT_INBOX],
    subject: `[Ticket ${input.ticketId}] ${input.subject}`,
    text: renderSupportTicketEmailText(input),
    ...(input.memberEmail ? { reply_to: input.memberEmail } : {}),
  }

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
      console.error('[mail] Resend rejected support ticket email:', response.status, detail)
      return { sent: false, error: `http-${response.status}` }
    }

    return { sent: true }
  } catch (error: unknown) {
    const name = error instanceof Error ? error.name : ''
    if (name === 'AbortError') {
      console.error('[mail] Resend timed out sending support ticket email.')
      return { sent: false, error: 'timeout' }
    }
    console.error('[mail] Failed to send support ticket email:', error)
    return { sent: false, error: 'network' }
  }
}
