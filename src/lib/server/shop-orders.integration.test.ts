import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { inArray } from 'drizzle-orm'
import { requireMerchDevDatabase } from '../../../scripts/merch/database'
import { merchOrders } from '../../db/schema'
import { shopOrderNeedsAttention } from '../shop-orders'

vi.mock('./admin-oversight', () => ({ requireStaff: vi.fn().mockResolvedValue({ userId: 'staff-fixture' }) }))

import { getDb } from '../../db'
import { listAdminShopOrders } from './store-operations'

const tag = `shop-fixture-${randomUUID().slice(0, 8)}`
const ids: Record<string, string> = {}
const fixtures: Array<Partial<typeof merchOrders.$inferInsert> & { key: string }> = [
  { key: 'unpaid', paymentStatus: 'unpaid', fulfillmentStatus: 'awaiting_payment' },
  { key: 'draft', paymentStatus: 'paid', fulfillmentStatus: 'printful_draft', printfulOrderId: '901', providerStatus: 'draft' },
  { key: 'failed', paymentStatus: 'paid', fulfillmentStatus: 'fulfillment_failed', fulfillmentError: 'Printful is not configured.' },
  { key: 'shipped', paymentStatus: 'paid', fulfillmentStatus: 'submitted_to_printful', printfulOrderId: '902', providerStatus: 'fulfilled' },
  { key: 'refundedInProduction', paymentStatus: 'partially_refunded', fulfillmentStatus: 'submitted_to_printful', printfulOrderId: '903', providerStatus: 'inprocess', refundCents: 500 },
  { key: 'canceledRefunded', paymentStatus: 'refunded', fulfillmentStatus: 'submitted_to_printful', printfulOrderId: '904', providerStatus: 'canceled', refundCents: 2000 },
  { key: 'live', paymentStatus: 'paid', fulfillmentStatus: 'submitted_to_printful', printfulOrderId: '905', providerStatus: 'pending', livemode: true },
]

const suite = describe.skipIf(process.env.RUN_MERCH_INTEGRATION !== '1')
suite('admin shop orders on Neon dev', () => {
  let before: Awaited<ReturnType<typeof listAdminShopOrders>>['summary']
  beforeAll(async () => {
    requireMerchDevDatabase(process.env)
    before = (await listAdminShopOrders({ data: { includeTest: true, filter: 'all' } })).summary
    for (const { key, ...row } of fixtures) {
      const [order] = await getDb().insert(merchOrders).values({
        customerEmail: `${tag}-${key}@example.com`, totalCents: 2000, subtotalCents: 2000, livemode: false, ...row,
      }).returning({ id: merchOrders.id })
      ids[key] = order.id
    }
  })
  afterAll(async () => {
    const owned = Object.values(ids)
    if (owned.length) await getDb().delete(merchOrders).where(inArray(merchOrders.id, owned))
  })

  const keysOf = (orders: Array<{ id: string }>) =>
    orders.map(o => Object.keys(ids).find(k => ids[k] === o.id)).sort()

  it('lists only orders that need a person, and agrees with the client rule', async () => {
    const { orders } = await listAdminShopOrders({ data: { query: tag, includeTest: true, filter: 'attention' } })
    expect(keysOf(orders)).toEqual(['draft', 'failed', 'refundedInProduction'])
    for (const order of orders) expect(shopOrderNeedsAttention(order)).toBe(true)
  })

  it('filters paid orders and hides test orders unless asked', async () => {
    const paid = await listAdminShopOrders({ data: { query: tag, includeTest: true, filter: 'paid' } })
    expect(keysOf(paid.orders)).toEqual(['canceledRefunded', 'draft', 'failed', 'live', 'refundedInProduction', 'shipped'])
    const liveOnly = await listAdminShopOrders({ data: { query: tag, filter: 'all' } })
    expect(keysOf(liveOnly.orders)).toEqual(['live'])
    expect(liveOnly.orders[0]).not.toHaveProperty('statusTokenHash')
  })

  it('counts paid orders and revenue after refunds', async () => {
    const { summary } = await listAdminShopOrders({ data: { includeTest: true, filter: 'all' } })
    expect(summary.paidOrders - before.paidOrders).toBe(6)
    expect(summary.revenueCents - before.revenueCents).toBe(6 * 2000 - 500 - 2000)
    expect(summary.attention - before.attention).toBe(3)
  })
})
