import Stripe from 'stripe'
import { describe, expect, it } from 'vitest'
import { createStripeWebhookVerifier, verifyStripeWebhookSignature } from './stripe-webhook'

const SECRET = 'whsec_test_premium_signature'

function signedPayload(payload: string, secret = SECRET) {
  return Stripe.webhooks.generateTestHeaderString({ payload, secret })
}

describe('stripe webhook signature', () => {
  const payload = JSON.stringify({
    id: 'evt_premium_test',
    object: 'event',
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    api_version: '2026-07-29.dahlia',
    data: { object: { id: 'cs_test' } },
  })

  it.each(['2026-07-29.dahlia', '2026-09-30.endive'])(
    'accepts a signed payload from an endpoint using %s',
    (apiVersion) => {
      const versionedPayload = JSON.stringify({ ...JSON.parse(payload), api_version: apiVersion })
      const event = verifyStripeWebhookSignature(
        createStripeWebhookVerifier(),
        versionedPayload,
        signedPayload(versionedPayload),
        SECRET,
      )
      expect(event.id).toBe('evt_premium_test')
      expect(event.type).toBe('checkout.session.completed')
      expect(event.api_version).toBe(apiVersion)
    },
  )

  it('rejects a valid signature older than the default replay tolerance', () => {
    const header = Stripe.webhooks.generateTestHeaderString({
      payload, secret: SECRET, timestamp: Math.floor(Date.now() / 1000) - 600,
    })
    expect(() => verifyStripeWebhookSignature(createStripeWebhookVerifier(), payload, header, SECRET))
      .toThrow(/Timestamp outside the tolerance zone/)
  })

  it('rejects a missing signature, a wrong secret, and a tampered payload', () => {
    const header = signedPayload(payload)
    const verifier = createStripeWebhookVerifier()
    expect(() => verifyStripeWebhookSignature(verifier, payload, null, SECRET)).toThrow(/Missing Stripe signature/)
    expect(() => verifyStripeWebhookSignature(verifier, payload, '', SECRET)).toThrow(/Missing Stripe signature/)
    expect(() => verifyStripeWebhookSignature(verifier, payload, header, 'whsec_other_secret')).toThrow()
    expect(() => verifyStripeWebhookSignature(verifier, `${payload} `, header, SECRET)).toThrow()
  })

  it('refuses to verify when the webhook secret is blank', () => {
    expect(() =>
      verifyStripeWebhookSignature(createStripeWebhookVerifier(), payload, signedPayload(payload), '  '),
    ).toThrow(/STRIPE_WEBHOOK_SECRET/)
  })
})
