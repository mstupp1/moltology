import { env } from '../../env'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { getResendContact } from './resend-contacts'
import { recordProviderUnsubscribe } from './email-opt-in'

/** Standard Webhooks/Svix signature over the raw body, with replay time tolerance. */
export function verifyResendWebhook(body: string, headers: Headers, secret: string, now = Date.now()): boolean {
  const id = headers.get('svix-id')
  const timestamp = headers.get('svix-timestamp')
  const signatures = headers.get('svix-signature')
  if (!id || !timestamp || !signatures || !secret.startsWith('whsec_')) return false
  const seconds = Number(timestamp)
  if (!Number.isFinite(seconds) || Math.abs(now / 1000 - seconds) > 300) return false
  const expected = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`${id}.${timestamp}.${body}`).digest()
  return signatures.split(' ').some(signature => {
    const [version, encoded] = signature.split(',')
    if (version !== 'v1' || !encoded) return false
    const actual = Buffer.from(encoded, 'base64')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}

export async function handleResendWebhook(request: Request): Promise<Response> {
  const secret = process.env.RESEND_WEBHOOK_SECRET ?? env.RESEND_WEBHOOK_SECRET
  if (!secret) return new Response('Webhook unavailable', { status: 503 })
  const body = await request.text()
  if (!verifyResendWebhook(body, request.headers, secret)) return new Response('Invalid signature', { status: 401 })
  let event: { type: string; data?: { email?: string; unsubscribed?: boolean } }
  try { event = JSON.parse(body) } catch { return new Response('Invalid payload', { status: 400 }) }
  if (event?.type !== 'contact.updated' || event.data?.unsubscribed !== true || typeof event.data.email !== 'string') {
    return new Response('OK')
  }
  try {
    // Fetch current status instead of trusting an old delivery after a fresh opt-in.
    // Repeated deliveries are safe: only idempotent local opt-out writes occur.
    const contact = await getResendContact(event.data.email)
    if (contact?.unsubscribed) await recordProviderUnsubscribe(event.data.email)
    return new Response('OK')
  } catch {
    console.warn('[marketing] Could not process unsubscribe webhook.')
    return new Response('Please retry', { status: 500 })
  }
}
