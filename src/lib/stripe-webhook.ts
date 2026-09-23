import Stripe from 'stripe'

export interface StripeWebhookVerifier {
  webhooks: {
    constructEvent: (payload: string, header: string, secret: string) => Stripe.Event
  }
}

/**
 * Verify a Stripe webhook payload before any membership write.
 * The signing secret is required. A missing or invalid signature throws.
 */
export function verifyStripeWebhookSignature(
  stripe: StripeWebhookVerifier,
  payload: string,
  signature: string | null | undefined,
  secret: string,
): Stripe.Event {
  if (!secret.trim()) {
    throw new Error('Premium billing is not configured. Missing: STRIPE_WEBHOOK_SECRET.')
  }
  if (!signature?.trim()) {
    throw new Error('Missing Stripe signature.')
  }
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

/** Instance used only to verify signatures. The key is never sent to Stripe. */
export function createStripeWebhookVerifier(): StripeWebhookVerifier {
  return new Stripe('webhook_verifier_not_a_key', {
    apiVersion: '2026-07-29.dahlia',
  })
}
