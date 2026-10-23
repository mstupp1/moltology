import type Stripe from 'stripe'

// Keep outgoing requests aligned with the installed SDK's generated types.
// Webhook payload versions are configured separately on each Stripe endpoint.
export const STRIPE_API_VERSION = '2026-09-30.endive' satisfies Stripe.LatestApiVersion
