import { describe, expect, it, vi } from 'vitest'
import { beforeEach } from 'vitest'
import { getDb } from '../../db'
import { getMerchCatalogHandler, createMerchCheckoutSessionHandler, fulfillMerchCheckoutEvent } from './merch'
import { fulfillPaidMerchOrder } from './merch-fulfillment'

vi.mock('../../db', () => ({ getDb: vi.fn(() => ({})) }))

vi.mock('./merch-fulfillment', () => ({ fulfillPaidMerchOrder: vi.fn().mockResolvedValue(undefined) }))

vi.mock('../user-sync', () => ({ ensureUserProfile: vi.fn().mockResolvedValue(null) }))

function storeDb(profile: { role: string; experiments?: string[] }) {
  const limit = vi.fn().mockResolvedValue([profile])
  const orderBy = vi.fn().mockResolvedValue([])
  const query = { from: () => query, where: () => query, limit, orderBy }
  return { select: vi.fn(() => query) }
}

describe('new store experiment server gate', () => {
  it.each([
    { role: 'admin', experiments: [] },
    { role: 'admin', experiments: ['premium'] },
    { role: 'user', experiments: ['new-store'] },
  ])('blocks catalog and checkout for $role with $experiments', async (profile) => {
    const db = storeDb(profile)
    vi.mocked(getDb).mockReturnValue(db as never)
    const args = { context: { user: { sub: 'viewer-1' }, db: db as never } }
    await expect(getMerchCatalogHandler(args)).rejects.toThrow('This page is not available.')
    await expect(createMerchCheckoutSessionHandler({ ...args, data: { items: [] } })).rejects.toThrow('This page is not available.')
    expect(db.select).toHaveBeenCalled()
  })

  it('loads the catalog for an opted-in admin', async () => {
    const db = storeDb({ role: 'admin', experiments: ['new-store'] })
    vi.mocked(getDb).mockReturnValue(db as never)
    await expect(getMerchCatalogHandler({ context: { user: { sub: 'admin-1' }, db: db as never } })).resolves.toEqual([])
    expect(db.select).toHaveBeenCalled()
  })
})

describe('merch fulfilment waits for payment', () => {
  function orderDb() {
    const order = { id: 'order-1', userId: 'u1', fulfillmentStatus: 'pending', subtotalCents: 2800, shippingCents: 695, taxCents: 0, lineItems: [] }
    const sets: Array<Record<string, unknown>> = []
    const query = { from: () => query, where: () => query, limit: vi.fn().mockResolvedValue([order]) }
    const update = { set: (values: Record<string, unknown>) => { sets.push(values); return update }, where: vi.fn().mockResolvedValue([]) }
    vi.mocked(getDb).mockReturnValue({ select: () => query, update: () => update } as never)
    return sets
  }

  const session = (payment_status: string) => ({
    id: 'cs_1',
    payment_status,
    metadata: { orderType: 'merch', orderId: 'order-1' },
    customer_details: { email: 'ops@example.com' },
    collected_information: {
      shipping_details: { name: 'Ops', address: { line1: '1 Trench', city: 'Seattle', postal_code: '98101', country: 'US' } },
    },
  })

  it('holds an unpaid checkout instead of sending it to Printful', async () => {
    const sets = orderDb()
    await fulfillMerchCheckoutEvent({ type: 'checkout.session.completed', data: { object: session('unpaid') } })
    expect(sets.map((s) => s.fulfillmentStatus)).toEqual(['awaiting_payment'])
    expect(fulfillPaidMerchOrder).not.toHaveBeenCalled()
  })

  it('marks a failed delayed payment without fulfilling', async () => {
    const sets = orderDb()
    await fulfillMerchCheckoutEvent({ type: 'checkout.session.async_payment_failed', data: { object: session('unpaid') } })
    expect(sets.map((s) => s.fulfillmentStatus)).toEqual(['payment_failed'])
    expect(fulfillPaidMerchOrder).not.toHaveBeenCalled()
  })

  it('fulfils once Stripe reports the session paid', async () => {
    vi.stubEnv('PRINTFUL_API_TOKEN', 'pf-test')
    const sets = orderDb()
    await fulfillMerchCheckoutEvent({ type: 'checkout.session.async_payment_succeeded', data: { object: session('paid') } })
    expect(sets).toEqual([expect.objectContaining({ paymentStatus: 'paid' })])
    expect(fulfillPaidMerchOrder).toHaveBeenCalledWith(expect.anything(), 'order-1', expect.objectContaining({ paid: true }), false, false)
    expect(fulfillPaidMerchOrder).toHaveBeenCalledTimes(1)
    vi.unstubAllEnvs()
  })
})
