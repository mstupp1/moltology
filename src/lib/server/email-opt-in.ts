import { createHmac, timingSafeEqual } from 'node:crypto'
import { and, eq, sql } from 'drizzle-orm'
import { getDb } from '../../db'
import { authUser, leads, profiles } from '../../db/schema'
import { DEV_AUTH_SECRET, getAuthBaseUrl } from '../auth-config'
import { sendTransactionalEmail } from './mail'
import { checkRateLimit } from '../ai/guardrails'
import { getResendContact, moveResendContactToUsers, subscribeResendContact, unsubscribeResendContact, MARKETING_UPDATE_ERROR } from './resend-contacts'

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

export type OptInResult = { status: 'pending' | 'subscribed' | 'error' }

const normalizedEmail = (email: string) => email.trim().toLowerCase()

async function findUser(email: string) {
  const [user] = await getDb().select({ id: authUser.id, emailVerified: authUser.emailVerified, isSimulated: profiles.isSimulated })
    .from(authUser).innerJoin(profiles, eq(authUser.id, profiles.id))
    .where(sql`lower(${authUser.email}) = ${normalizedEmail(email)}`).limit(1)
  return user
}

/** Pending requests reuse the existing lead timestamp; no contact is created. */
export async function requestEmailOptIn(email: string, source: string, deferConfirmation = false): Promise<OptInResult> {
  try {
    const db = getDb()
    const normalized = normalizedEmail(email)
    if (!checkRateLimit(`marketing-confirm:${normalized}`, 3, 60 * 60 * 1000).success) throw new Error('rate limited')
    const [existing] = await db.select().from(leads).where(eq(leads.email, normalized)).limit(1)
    if (existing?.emailOptIn) return { status: 'subscribed' }
    // Keep the pending timestamp stable within a minute so repeated clicks reuse the link.
    const now = existing?.emailOptInAt && existing.emailOptInAt.getTime() > Date.now() - 60_000
      ? existing.emailOptInAt : new Date()
    if (!existing) {
      await db.insert(leads).values({ email: normalized, source, claimedPdf: false, emailOptIn: false, emailOptInAt: now })
    } else {
      await db.update(leads).set({ emailOptInAt: now, updatedAt: now }).where(eq(leads.email, normalized))
    }
    if (!deferConfirmation) {
      const url = `${getAuthBaseUrl()}${EMAIL_OPT_IN_CONFIRM_PATH}?token=${encodeURIComponent(createEmailOptInToken(normalized, now.getTime()))}`
      const result = await sendTransactionalEmail({ to: normalized, subject: EMAIL_OPT_IN_MAIL.subject, text: EMAIL_OPT_IN_MAIL.text(url) })
      if (!result.sent) throw new Error('confirmation not sent')
    }
    return { status: 'pending' }
  } catch {
    console.warn('[email-opt-in] Could not request confirmation.')
    return { status: 'error' }
  }
}

async function savePreference(email: string, optedIn: boolean, source: string) {
  const db = getDb()
  const now = new Date()
  await db.update(leads).set({ emailOptIn: optedIn, emailOptInAt: optedIn ? now : null, updatedAt: now })
    .where(eq(leads.email, normalizedEmail(email)))
  const user = await findUser(email)
  if (user) await db.update(profiles).set({ emailOptIn: optedIn, emailOptInAt: optedIn ? now : null, emailOptInSource: source, updatedAt: now })
    .where(eq(profiles.id, user.id))
}

/** Called by account settings with the authenticated user's address, never client-supplied email. */
export async function setEmailPreference(email: string, optedIn: boolean, source: string): Promise<OptInResult | { status: 'unsubscribed' }> {
  const user = await findUser(email)
  if (user?.isSimulated) throw new Error(MARKETING_UPDATE_ERROR)
  if (optedIn && !user?.emailVerified) return requestEmailOptIn(email, source)
  if (optedIn) await subscribeResendContact(email, 'users')
  else await unsubscribeResendContact(email)
  await savePreference(email, optedIn, source)
  return { status: optedIn ? 'subscribed' : 'unsubscribed' }
}

/** Provider opt-outs only; provider-side subscription changes never manufacture consent. */
export async function recordProviderUnsubscribe(email: string) {
  await savePreference(email, false, 'email_unsubscribe')
}

export async function activateEmailOptIn(email: string): Promise<void> {
  const user = await findUser(email)
  if (user?.isSimulated) throw new Error(MARKETING_UPDATE_ERROR)
  await subscribeResendContact(email, user ? 'users' : 'leads')
  await savePreference(email, true, 'email_confirmation')
}

/** Signup and OAuth account creation convert an existing lead without creating a new contact. */
export async function handleMarketingSignup(user: { id: string; email: string; emailVerified?: boolean }, optedIn: boolean, defer: boolean) {
  const db = getDb()
  if (optedIn) {
    if (user.emailVerified) await activateEmailOptIn(user.email)
    else {
      const result = await requestEmailOptIn(user.email, 'signup', defer)
      if (result.status === 'error') throw new Error(MARKETING_UPDATE_ERROR)
      if (result.status === 'pending') await db.update(profiles).set({ emailOptInSource: 'signup_pending' }).where(eq(profiles.id, user.id))
    }
  }
  const [lead] = await db.select().from(leads).where(eq(leads.email, normalizedEmail(user.email))).limit(1)
  if (lead?.emailOptIn) {
    // Preserve a Resend unsubscribe even when the local webhook has not arrived yet.
    const contact = await getResendContact(user.email)
    if (contact) {
      await moveResendContactToUsers(user.email)
      await savePreference(user.email, !contact.unsubscribed, 'lead_conversion')
    }
  }
  await db.update(leads).set({ convertedToUser: true, updatedAt: new Date() }).where(eq(leads.email, normalizedEmail(user.email)))
}

export async function confirmSignupMarketing(user: { id: string; email: string }) {
  const db = getDb()
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1)
  const [lead] = await db.select().from(leads).where(eq(leads.email, normalizedEmail(user.email))).limit(1)
  if (profile?.emailOptInSource === 'signup_pending' && lead?.emailOptInAt && !lead.emailOptIn) await activateEmailOptIn(user.email)
}

export async function handleEmailOptInConfirm(request: Request): Promise<Response> {
  const token = new URL(request.url).searchParams.get('token')
  const email = verifyEmailOptInToken(token)
  let status = 'expired'
  if (email && token) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8')) as { x: number }
      const requestedAt = payload.x - EMAIL_OPT_IN_TTL_MS
      const [lead] = await getDb().select().from(leads).where(and(eq(leads.email, email), eq(leads.emailOptIn, false))).limit(1)
      if (lead?.emailOptInAt?.getTime() === requestedAt) {
        await activateEmailOptIn(email)
        status = 'confirmed'
      }
    } catch {
      console.warn('[email-opt-in] Could not confirm.')
      status = 'error'
    }
  }
  return new Response(null, { status: 303, headers: { Location: `/org?email=${status}` } })
}
