import Stripe from 'stripe'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '../../db'
import { merchOrders } from '../../db/schema'
import { requireMerchDevDatabase } from '../../../scripts/merch/database'
import { ensurePrintfulOrder } from './printful'
import { handleStripeWebhookRequest } from './premium'

// Opt-in: real dev database, mocked manufacturer. Never creates a paid or real Printful order.
vi.mock('./printful', () => ({ ensurePrintfulOrder: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })

describe.skipIf(process.env.RUN_MERCH_INTEGRATION !== '1')('signed merch webhook on Neon dev', () => {
  it('claims concurrent signed deliveries once and preserves one Printful draft on replay', async () => {
    requireMerchDevDatabase(process.env)
    vi.stubEnv('PRINTFUL_API_TOKEN', 'integration-token')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_integration')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_merchintegration')
    vi.mocked(ensurePrintfulOrder).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))
      return { id: 'integration-draft', status: 'draft' }
    })
    const db = getDb()
    const id = randomUUID()
    const sessionId = `cs_test_${id}`
    await db.insert(merchOrders).values({
      id, stripeCheckoutSessionId: sessionId,
      lineItems: [{ variantId: randomUUID(), productId: randomUUID(), productTitle: 'Test mug', productSlug: 'test-mug', variantTitle: '11 oz', size: '11 oz', color: 'White', printfulSyncVariantId: 4123456789, quantity: 1, unitPriceCents: 1800 }],
    })
    try {
      const payload = JSON.stringify({ id: `evt_${id}`, object: 'event', livemode: false, type: 'checkout.session.completed', data: { object: {
        id: sessionId, mode: 'payment', livemode: false, payment_status: 'paid', metadata: { orderType: 'merch', orderId: id },
        customer_details: { email: 'pilot-test@example.com' },
        collected_information: { shipping_details: { name: 'Pilot Test', address: { line1: '1 Test Street', city: 'Seattle', state: 'WA', postal_code: '98101', country: 'US' } } },
        amount_subtotal: 1800, amount_total: 2495, currency: 'usd', total_details: { amount_tax: 0, amount_shipping: 695 },
      } } })
      const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET! })
      const request = (sig = signature) => new Request('http://localhost:3000/api/stripe/webhook', { method: 'POST', body: payload, headers: { 'stripe-signature': sig } })
      expect((await handleStripeWebhookRequest(request('invalid'))).status).toBe(400)
      expect(ensurePrintfulOrder).not.toHaveBeenCalled()
      const concurrent = await Promise.all([handleStripeWebhookRequest(request()), handleStripeWebhookRequest(request())])
      expect(concurrent.some(result => result.status === 200)).toBe(true)
      expect((await handleStripeWebhookRequest(request())).status).toBe(200)
      expect(ensurePrintfulOrder).toHaveBeenCalledTimes(1)
      expect(ensurePrintfulOrder).toHaveBeenCalledWith('integration-token', expect.objectContaining({ draft: true, external_id: id.replaceAll('-', '') }))
      const [order] = await db.select().from(merchOrders).where(eq(merchOrders.id, id))
      expect(order.fulfillmentStatus).toBe('printful_draft')
      expect(order.printfulOrderId).toBe('integration-draft')
      expect(order.totalCents).toBe(2495)
    } finally {
      await db.delete(merchOrders).where(eq(merchOrders.id, id))
    }
  }, 30_000)
})
