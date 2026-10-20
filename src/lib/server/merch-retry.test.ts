import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const { retrieve } = vi.hoisted(() => ({ retrieve: vi.fn() }))
vi.mock('stripe', () => ({ default: class { checkout = { sessions: { retrieve } } } }))
vi.mock('../../db', () => ({ getDb: vi.fn() }))
vi.mock('../user-sync', () => ({ ensureUserProfile: vi.fn() }))
vi.mock('./merch-fulfillment', () => ({ fulfillPaidMerchOrder: vi.fn() }))
import { getDb } from '../../db'
import { fulfillPaidMerchOrder } from './merch-fulfillment'
import { retryMerchOrder } from './merch'
const shipping = { name: 'Test', line1: '1 Saved Street', city: 'Seattle', country: 'US', postalCode: '98101' }
beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('STRIPE_SECRET_KEY', 'rk_test_example')
  vi.mocked(getDb).mockReturnValue({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ id: 'order-1', stripeCheckoutSessionId: 'cs_1', fulfillmentStatus: 'fulfillment_failed', shippingAddress: shipping, customerEmail: 'saved@example.com' }] }) }) }) } as never)
})
afterEach(() => vi.unstubAllEnvs())
describe('operator merch retry', () => {
  it.each(['unpaid', 'no_payment_required'])('refuses payment status %s before fulfillment', async payment_status => {
    retrieve.mockResolvedValue({ id: 'cs_1', payment_status, metadata: { orderType: 'merch', orderId: 'order-1' } })
    await expect(retryMerchOrder('order-1')).rejects.toThrow('not confirmed')
    expect(fulfillPaidMerchOrder).not.toHaveBeenCalled()
  })
  it('rejects a Stripe session belonging to another order', async () => {
    retrieve.mockResolvedValue({ id: 'cs_1', payment_status: 'paid', metadata: { orderType: 'merch', orderId: 'other-order' } })
    await expect(retryMerchOrder('order-1')).rejects.toThrow('not confirmed')
    expect(fulfillPaidMerchOrder).not.toHaveBeenCalled()
  })
  it('uses saved shipping and email rather than mutable Stripe/catalog data', async () => {
    retrieve.mockResolvedValue({ id: 'cs_1', livemode: false, payment_status: 'paid', metadata: { orderType: 'merch', orderId: 'order-1' }, customer_email: 'different@example.com' })
    await retryMerchOrder('order-1')
    expect(retrieve).toHaveBeenCalledWith('cs_1')
    expect(fulfillPaidMerchOrder).toHaveBeenCalledWith(expect.anything(), 'order-1', expect.objectContaining({ email: 'saved@example.com', shipping }), false, true)
  })
})
