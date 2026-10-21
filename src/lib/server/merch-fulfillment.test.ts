import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import { fulfillPaidMerchOrder, MERCH_FULFILLMENT_LEASE_MS } from './merch-fulfillment'
import { ensurePrintfulOrder } from './printful'
import type { getDb } from '../../db'
import type { MerchCheckoutCompletion } from '../merch'

vi.mock('./printful', () => ({ ensurePrintfulOrder: vi.fn() }))
const completion: MerchCheckoutCompletion = {
  orderId: 'order-1', sessionId: 'cs_1', customerId: null, email: 'ops@example.com',
  shipping: { name: 'Ops', line1: '1 Test', line2: null, city: 'Seattle', state: 'WA', postalCode: '98101', country: 'US', phone: null },
  subtotalCents: 1800, shippingCents: 695, taxCents: 0, discountCents: 0, totalCents: 2495, currency: 'usd', paid: true,
}

function database(claims = 1, status = 'processing') {
  const changes: Array<Record<string, unknown>> = []
  const predicates: SQL[] = []
  const snapshot = { fulfillmentMode: 'manual', refundCents: 0, id: 'order-1', customerEmail: completion.email, shippingAddress: completion.shipping, lineItems: [{ printfulSyncVariantId: 4123456789, quantity: 1 }] }
  const db = {
    update: () => ({ set: (values: Record<string, unknown>) => {
      changes.push(values)
      return { where: (predicate: SQL) => {
        predicates.push(predicate)
        return values.fulfillmentStatus === 'processing'
          ? { returning: async () => claims-- > 0 ? [snapshot] : [] }
          : Promise.resolve([])
      } }
    } }),
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ fulfillmentStatus: status }] }) }) }),
  }
  return { db: db as unknown as ReturnType<typeof getDb>, changes, predicates, snapshot }
}
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('PRINTFUL_API_TOKEN', 'token'); vi.mocked(ensurePrintfulOrder).mockResolvedValue({ id: '42', status: 'draft' }) })
afterEach(() => vi.unstubAllEnvs())

describe('paid merch fulfillment', () => {
  it('refuses unpaid completion before claiming an order', async () => {
    const { db, changes } = database()
    await expect(fulfillPaidMerchOrder(db, 'order-1', { ...completion, paid: false }, false)).rejects.toThrow('not confirmed')
    expect(changes).toEqual([])
    expect(ensurePrintfulOrder).not.toHaveBeenCalled()
  })
  it('claims the order atomically, forces test drafts, and fences completion to the lease', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('PRINTFUL_DRAFT', 'false'); vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_example')
    const { db, changes, predicates } = database()
    await fulfillPaidMerchOrder(db, 'order-1', completion, false)
    expect(ensurePrintfulOrder).toHaveBeenCalledWith('token', expect.objectContaining({ draft: true, external_id: 'order-1' }))
    expect(changes[1]).toMatchObject({ fulfillmentStatus: 'printful_draft', printfulOrderId: '42' })
    const dialect = new PgDialect()
    const claim = dialect.sqlToQuery(predicates[0])
    expect(claim.sql).toContain('"fulfillmentStatus" in')
    expect(claim.sql).toContain('"updatedAt" <')
    expect(claim.params).toContain('processing')
    expect(claim.params).not.toContain('fulfillment_failed')
    const finish = dialect.sqlToQuery(predicates[1])
    expect(finish.sql).toContain('"updatedAt" =')
    expect(finish.params).toContain('processing')
    expect(MERCH_FULFILLMENT_LEASE_MS).toBeGreaterThan(60_000)
  })
  it('requires a new automatic order plus explicit live-production setup to confirm', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('PRINTFUL_DRAFT', 'false'); vi.stubEnv('STRIPE_SECRET_KEY', 'sk_live_example'); vi.stubEnv('VERCEL_ENV','production')
    const automatic = database()
    automatic.snapshot.fulfillmentMode = 'automatic'
    await fulfillPaidMerchOrder(automatic.db, 'order-1', completion, true)
    expect(ensurePrintfulOrder).toHaveBeenLastCalledWith('token', expect.objectContaining({ draft: false }))
    const oldManual = database()
    await fulfillPaidMerchOrder(oldManual.db, 'order-1', completion, true)
    expect(ensurePrintfulOrder).toHaveBeenLastCalledWith('token', expect.objectContaining({ draft: true }))
    vi.stubEnv('VERCEL_ENV','preview')
    const preview = database(); preview.snapshot.fulfillmentMode = 'automatic'
    await fulfillPaidMerchOrder(preview.db, 'order-1', completion, true)
    expect(ensurePrintfulOrder).toHaveBeenLastCalledWith('token', expect.objectContaining({ draft: true }))
  })
  it('blocks a refunded order before provider submission', async () => {
    const refunded = database(); refunded.snapshot.refundCents = 100
    await expect(fulfillPaidMerchOrder(refunded.db,'order-1',completion,false)).rejects.toThrow('refund')
    expect(ensurePrintfulOrder).not.toHaveBeenCalled()
  })
  it('only submits once when two deliveries compete for the claim', async () => {
    const { db } = database(1)
    const results = await Promise.allSettled([
      fulfillPaidMerchOrder(db, 'order-1', completion, false),
      fulfillPaidMerchOrder(db, 'order-1', completion, false),
    ])
    expect(ensurePrintfulOrder).toHaveBeenCalledTimes(1)
    expect(results.filter(result => result.status === 'rejected')).toHaveLength(1)
  })
  it('replaying a completed event never submits again', async () => {
    const { db } = database(0, 'printful_draft')
    await fulfillPaidMerchOrder(db, 'order-1', completion, false)
    expect(ensurePrintfulOrder).not.toHaveBeenCalled()
  })
  it('records failures and only includes failed orders when explicitly retried', async () => {
    vi.mocked(ensurePrintfulOrder).mockRejectedValueOnce(new Error('network error with private address'))
    const failed = database()
    await expect(fulfillPaidMerchOrder(failed.db, 'order-1', completion, false)).rejects.toThrow('could not be verified')
    expect(failed.changes[1]).toMatchObject({ fulfillmentStatus: 'fulfillment_failed' })
    expect(JSON.stringify(failed.changes)).not.toContain('private address')
    const retried = database()
    await fulfillPaidMerchOrder(retried.db, 'order-1', completion, false, true)
    expect(new PgDialect().sqlToQuery(retried.predicates[0]).params).toContain('fulfillment_failed')
    expect(retried.changes[1]).not.toHaveProperty('fulfillmentError')
  })
  it('does not send placeholder variants to Printful even when loaded from an old order', async () => {
    const { db, snapshot } = database()
    snapshot.lineItems[0].printfulSyncVariantId = 920801
    await expect(fulfillPaidMerchOrder(db, 'order-1', completion, false)).rejects.toThrow('unsynced')
    expect(ensurePrintfulOrder).not.toHaveBeenCalled()
  })
})
