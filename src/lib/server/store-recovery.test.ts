import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { merchOrders, storeOutbox, storeRateLimits } from '../../db/schema'
const mocks = vi.hoisted(() => ({ db: {} as any, retrieve: vi.fn(), fulfill: vi.fn(), mail: vi.fn() }))
vi.mock('../../db', () => ({ getDb: () => mocks.db }))
vi.mock('stripe', () => ({ default: class { checkout = { sessions: { retrieve: mocks.retrieve } } } }))
vi.mock('./merch', () => ({ fulfillMerchCheckoutEvent: mocks.fulfill }))
vi.mock('./mail', () => ({ sendTransactionalEmail: mocks.mail }))
import { recoverStore } from './store-operations'
let busy = false
let writes: Array<{ table: unknown; value: any }> = []
let orderPredicates: any[] = []
const order = { id:'00000000-0000-4000-8000-000000000001', stripeCheckoutSessionId:'cs_test_stuck', stripePaymentIntentId:null, printfulOrderId:null, statusTokenHash:null, paymentStatus:'paid', customerEmail:null }
beforeEach(() => {
  vi.clearAllMocks(); busy = false; writes = []; orderPredicates = []
  vi.stubEnv('STRIPE_SECRET_KEY','sk_test_fixture'); vi.stubEnv('STORE_SUPPORT_INBOX','support@example.com')
  const completed = { then: (resolve: any) => Promise.resolve([]).then(resolve), returning: async () => [{ attempts:1 }] }
  mocks.db = {
    insert: (table: unknown) => ({ values: (value: any) => {
      writes.push({ table,value })
      return { onConflictDoNothing: async () => undefined, onConflictDoUpdate: () => ({ returning: async () => busy ? [] : [{ expiresAt:value.expiresAt }] }) }
    } }),
    update: () => ({ set: () => ({ where: () => completed }) }),
    delete: () => ({ where: async () => undefined }),
    select: () => ({ from: (table: unknown) => {
      const rows = table === storeOutbox ? [{ key:'payment:fixture',orderId:order.id,to:'buyer@example.com',subject:'Fixture',body:'Fixture',attempts:0,createdAt:new Date() }] : [order]
      const query = { where: (predicate: any) => { if (table === merchOrders) orderPredicates.push(predicate); return query }, orderBy: () => query, limit: async () => rows }
      return query
    } }),
  }
  mocks.mail.mockResolvedValue({ sent:true })
  mocks.retrieve.mockResolvedValue({ id:order.stripeCheckoutSessionId,payment_status:'paid' })
  mocks.fulfill.mockResolvedValue(undefined)
})
afterEach(() => vi.unstubAllEnvs())
describe('scheduled store recovery', () => {
  it('recovers a stuck paid session and sends queued mail before provider work', async () => {
    const result = await recoverStore()
    expect(result).toEqual({ orders:1,sent:1 })
    expect(mocks.retrieve).toHaveBeenCalledWith(order.stripeCheckoutSessionId)
    expect(mocks.fulfill).toHaveBeenCalledWith(expect.objectContaining({ type:'checkout.session.completed' }),true)
    expect(mocks.mail.mock.invocationCallOrder[0]).toBeLessThan(mocks.retrieve.mock.invocationCallOrder[0])
    expect(orderPredicates.some(predicate => new PgDialect().sqlToQuery(predicate).params.includes(false))).toBe(true)
  })
  it('alerts the configured operator when payment verification fails without blocking mail', async () => {
    mocks.retrieve.mockRejectedValueOnce(new Error('Provider unavailable'))
    await expect(recoverStore()).resolves.toEqual({ orders:1,sent:1 })
    expect(mocks.fulfill).not.toHaveBeenCalled()
    expect(writes.some(w => w.table === storeOutbox && w.value.to === 'support@example.com')).toBe(true)
  })
  it('does no work while another recovery owns the global lease', async () => {
    busy = true
    await expect(recoverStore()).resolves.toEqual({ busy:true })
    expect(mocks.mail).not.toHaveBeenCalled(); expect(mocks.retrieve).not.toHaveBeenCalled()
    expect(writes[0].table).toBe(storeRateLimits)
  })
})
