import { createHmac, timingSafeEqual } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { getDb } from '../../db'
import { leads } from '../../db/schema'
import { DEV_AUTH_SECRET, getAuthBaseUrl } from '../auth-config'
import { sendTransactionalEmail } from './mail'

/** How long a marketing opt-in confirmation link stays valid. */
export const EMAIL_OPT_IN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export const EMAIL_OPT_IN_CONFIRM_PATH = '/api/email/confirm'

export const EMAIL_OPT_IN_MAIL = {
  subject: 'Confirm Moltology emails',
  text: (url: string) =>
    [
      'Someone asked to get Moltology news and releases at this address.',
      '',
      `Confirm here: ${url}`,
      '',
      'If that was not you, ignore this email and nothing will be sent.',
    ].join('\n'),
} as const

function signingSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET
  if (secret && secret.length >= 16) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET must be set in production (min 16 characters).')
  }
  return DEV_AUTH_SECRET
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', `email-opt-in:${secret}`).update(payload).digest('base64url')
}

/** A signed, expiring token that proves the inbox owner clicked the link. */
export function createEmailOptInToken(email: string, now = Date.now(), secret = signingSecret()): string {
  const payload = Buffer.from(JSON.stringify({ e: email.trim().toLowerCase(), x: now + EMAIL_OPT_IN_TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

/** The email the token was issued for, or null when it is forged, malformed or expired. */
export function verifyEmailOptInToken(token: string | null | undefined, now = Date.now(), secret = signingSecret()): string | null {
  if (!token || token.length > 1024) return null
  const [payload, signature, extra] = token.split('.')
  if (!payload || !signature || extra !== undefined) return null
  const expected = Buffer.from(sign(payload, secret))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { e?: unknown; x?: unknown }
    if (typeof parsed.e !== 'string' || typeof parsed.x !== 'number' || parsed.x < now) return null
    return parsed.e
  } catch {
    return null
  }
}

/**
 * Records a pending marketing opt-in and emails a confirmation link. The address
 * only joins the list once its owner confirms. Failure never blocks the caller.
 */
export async function requestEmailOptIn(email: string, source: string): Promise<void> {
  try {
    const db = getDb()
    const normalized = email.trim().toLowerCase()
    const [existing] = await db.select().from(leads).where(eq(leads.email, normalized)).limit(1)
    if (existing?.emailOptIn) return
    if (!existing) {
      await db.insert(leads).values({ email: normalized, source, claimedPdf: false, emailOptIn: false })
    }
    const url = `${getAuthBaseUrl()}${EMAIL_OPT_IN_CONFIRM_PATH}?token=${encodeURIComponent(createEmailOptInToken(normalized))}`
    await sendTransactionalEmail({ to: normalized, subject: EMAIL_OPT_IN_MAIL.subject, text: EMAIL_OPT_IN_MAIL.text(url) })
  } catch (error) {
    console.warn('[email-opt-in] Could not request confirmation:', error)
  }
}

/** Handles the confirmation link: opts the address in and sends the visitor back to /org. */
export async function handleEmailOptInConfirm(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token')
  const email = verifyEmailOptInToken(token)
  let status = 'expired'
  if (email) {
    try {
      const db = getDb()
      const now = new Date()
      await db
        .update(leads)
        .set({ emailOptIn: true, emailOptInAt: now, updatedAt: now })
        .where(eq(leads.email, email))
      status = 'confirmed'
    } catch (error) {
      console.warn('[email-opt-in] Could not confirm:', error)
      status = 'error'
    }
  }
  return new Response(null, { status: 303, headers: { Location: `/org?email=${status}` } })
}
