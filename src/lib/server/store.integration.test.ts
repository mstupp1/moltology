import { randomUUID } from 'node:crypto'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { and, eq, inArray, like } from 'drizzle-orm'
import { STORE_DEFAULTS } from '../store'
import { requireMerchDevDatabase } from '../../../scripts/merch/database'
import { merchOrders, storeAudit, storeOutbox, storeOverrides, storeQuotes, storeRateLimits, storeSettings, profiles } from '../../db/schema'
const mocks = vi.hoisted(() => ({ rateKeys: [] as string[], settings: {} as any, customer: vi.fn(), create: vi.fn(), retrieve: vi.fn(), intent: vi.fn(), provider: vi.fn(), mail: vi.fn() }))
vi.mock('stripe', () => ({ default: class { customers = { create: mocks.customer }; checkout = { sessions: { create: mocks.create, retrieve: mocks.retrieve } }; paymentIntents = { retrieve: mocks.intent } } }))
vi.mock('./printful', () => ({ ensurePrintfulOrder: mocks.provider }))
vi.mock('./mail', () => ({ sendTransactionalEmail: mocks.mail }))
// Only settings reads are replaced with an in-process fixture. The deployed/dev public gate is never opened.
vi.mock('../../db', async importOriginal => {
  const actual = await importOriginal<typeof import('../../db')>()
  return { ...actual, getDb: () => {
    const real = actual.getDb()
    return new Proxy(real, { get(target, property) {
      if (property === 'insert') return (table: unknown) => {
        const builder = real.insert(table as any)
        return { values(value: any) { if (table === storeRateLimits) mocks.rateKeys.push(value.key); return builder.values(value) } }
      }
      if (property === 'select') return (...args: any[]) => {
        const builder = (real.select as any)(...args)
        return { from(table: unknown) {
          if (table === storeSettings) { const query = { where: () => query, limit: async () => [{ id: 'main', value: mocks.settings }] }; return query }
          return builder.from(table)
        } }
      }
      const value = Reflect.get(target, property)
      return typeof value === 'function' ? value.bind(target) : value
    } })
  } }
})
import { getDb } from '../../db'
import { createStoreQuote, createQuotedCheckout, getStoreStatus, limitStoreRequest, hashStoreValue } from './store'
import { fulfillMerchCheckoutEvent } from './merch'
import { drainStoreOutbox, enqueueOrderConfirmation, reconcileStoreOrder, syncStoreRefund, mutateAdminStore } from './store-operations'
const mug = '22222222-2222-4222-8222-001000000001', tee = '22222222-2222-4222-8222-001100000001'
const address = { name:'Store Fixture', line1:'19749 Dearborn St', line2:null, city:'Chatsworth', state:'CA', postalCode:'91311', country:'US', phone:null }
const owned: string[] = [], quotes: string[] = []
let calls: Array<{ url: string; body: any }> = []
const networkFetch = globalThis.fetch
let ratesAvailable = true
let remote: any
let previousOverrides: Array<typeof storeOverrides.$inferSelect> = []
const suite = describe.skipIf(process.env.RUN_MERCH_INTEGRATION !== '1')
suite('store checkout and operations on Neon dev', () => {
  beforeAll(async () => { requireMerchDevDatabase(process.env); previousOverrides = await getDb().select().from(storeOverrides).where(eq(storeOverrides.id,mug)) })
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.settings = { ...STORE_DEFAULTS, publicEnabled: true }
    vi.stubEnv('STORE_PUBLIC_LAUNCH_AUTHORIZED','true')
    vi.stubEnv('STORE_STATUS_SECRET','integration-status-secret-with-32-characters')
    vi.stubEnv('STRIPE_SECRET_KEY','sk_test_fixture')
    vi.stubEnv('PRINTFUL_API_TOKEN','fixture')
    vi.stubEnv('PRINTFUL_STORE_ID','18931450')
    calls = []
    remote = null
    ratesAvailable = true
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (!String(url).startsWith('https://api.printful.com/')) return networkFetch(url, init)
      calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null })
      if (String(url).endsWith('/shipping/rates')) return Response.json({ result: ratesAvailable ? [{ id:'STANDARD', name:'Standard', rate:'6.95', currency:'USD' }] : [] })
      if (String(url).includes('/orders/@') && remote) return Response.json({ result: remote })
      return new Response('', { status:404 })
    }))
    mocks.customer.mockResolvedValue({ id:`cus_${randomUUID()}` })
    mocks.create.mockImplementation(async (_params, options) => ({ id:`cs_test_${options.idempotencyKey}`,url:'https://checkout.stripe.com/test',status:'open' }))
    mocks.retrieve.mockResolvedValue({ id:'cs_test_existing',url:'https://checkout.stripe.com/test',status:'open' })
    mocks.provider.mockResolvedValue({ id:`fixture-${randomUUID()}`,status:'draft' })
    mocks.mail.mockResolvedValue({ sent:true })
    mocks.intent.mockResolvedValue({ livemode:false, status:'succeeded', latest_charge:{ amount_refunded:0 } })
  })
  afterEach(async () => {
    vi.unstubAllGlobals()
    const db = getDb()
    if (owned.length) { await db.delete(storeOutbox).where(inArray(storeOutbox.orderId,owned)); await db.delete(merchOrders).where(inArray(merchOrders.id,owned)); owned.length = 0 }
    if (quotes.length) { await db.delete(storeQuotes).where(inArray(storeQuotes.id,quotes)); quotes.length = 0 }
    if (mocks.rateKeys.length) { await db.delete(storeRateLimits).where(inArray(storeRateLimits.key,mocks.rateKeys)); mocks.rateKeys.length = 0 }
    vi.unstubAllEnvs()
  })
  afterAll(async () => {
    const db = getDb()
    if (owned.length) { await db.delete(storeOutbox).where(inArray(storeOutbox.orderId, owned)); await db.delete(merchOrders).where(inArray(merchOrders.id, owned)) }
    if (quotes.length) await db.delete(storeQuotes).where(inArray(storeQuotes.id, quotes))
    for (const previous of previousOverrides) await db.insert(storeOverrides).values(previous).onConflictDoUpdate({ target:storeOverrides.id,set:previous })
  })
  function delivery(items = [{ variantId:mug,quantity:1 }]) { return { email:`store-fixture-${randomUUID()}@example.com`,address,items } }
  async function quote(input: ReturnType<typeof delivery>) {
    const result = await createStoreQuote({ data: input, context: { clientIp:randomUUID() } })
    quotes.push(result.id)
    return result
  }
  async function checkout() {
    const input = delivery(), q = await quote(input)
    const result = await createQuotedCheckout({ data:{ ...input,quoteId:q.id },context:{ clientIp:randomUUID() } })
    owned.push(result.orderId)
    const [order] = await getDb().select().from(merchOrders).where(eq(merchOrders.id,result.orderId))
    return { input,q,result,order }
  }
  function paid(order: typeof merchOrders.$inferSelect) {
    return { id:order.stripeCheckoutSessionId!,payment_status:'paid',livemode:false,metadata:{ orderType:'merch',orderId:order.id },payment_intent:`pi_fixture_${order.id}`,
      amount_subtotal:order.subtotalCents,amount_total:order.totalCents,currency:'usd',total_details:{ amount_tax:0,amount_shipping:order.shippingCents },customer_details:{ email:'changed@example.com' } }
  }
  it.each([
    [{ variantId:mug,quantity:1 }], [{ variantId:tee,quantity:1 }], [{ variantId:mug,quantity:1 },{ variantId:tee,quantity:1 }], [{ variantId:mug,quantity:3 },{ variantId:tee,quantity:2 }],
  ])('quotes actual catalog IDs and quantities for a US cart', async (...items) => {
    const input = delivery(items as any)
    await quote(input)
    const body = calls[0].body
    expect(body.currency).toBe('USD')
    expect(body.items.map((i: any) => i.variant_id)).toEqual(input.items.map(i => i.variantId === mug ? 1320 : 4016))
    expect(body.items.map((i: any) => i.quantity)).toEqual(input.items.map(i => i.quantity))
  })
  it('rejects paused checkout, disabled destinations, unavailable rates and unavailable variants', async () => {
    const input = delivery()
    mocks.settings.checkoutPaused = true
    await expect(quote(input)).rejects.toThrow('paused')
    mocks.settings.checkoutPaused = false
    await expect(quote({ ...input,address:{ ...address,country:'CA' } })).rejects.toThrow('not enabled')
    await getDb().insert(storeOverrides).values({ id:mug,enabled:false }).onConflictDoUpdate({ target:storeOverrides.id,set:{ enabled:false } })
    try { await expect(quote(input)).rejects.toThrow('no longer available') } finally { await getDb().delete(storeOverrides).where(eq(storeOverrides.id,mug)) }
    ratesAvailable = false
    await expect(quote(input)).rejects.toThrow('unavailable')
  })
  it('binds quotes to cart, address and expiry; persists guest snapshot and isolated Stripe customer', async () => {
    const input = delivery(), q = await quote(input)
    for (const changed of [{ ...input,address:{ ...address,line2:'Apt 2' } },{ ...input,items:[{ variantId:mug,quantity:2 }] }]) await expect(createQuotedCheckout({ data:{ ...changed,quoteId:q.id },context:{ clientIp:randomUUID() } })).rejects.toThrow('changed')
    await getDb().update(storeQuotes).set({ expiresAt:new Date(0) }).where(eq(storeQuotes.id,q.id))
    await expect(createQuotedCheckout({ data:{ ...input,quoteId:q.id },context:{ clientIp:randomUUID() } })).rejects.toThrow('expired')
    const { order } = await checkout()
    expect(order.userId).toBeNull()
    expect(order.fulfillmentMode).toBe('manual')
    expect(order.quoteSnapshot?.address).toEqual(address)
    const params = mocks.create.mock.calls[0][0]
    expect(params.shipping_address_collection).toBeUndefined()
    expect(params.customer_update).toBeUndefined()
    expect(params.customer).toMatch(/^cus_/)
    expect(mocks.customer.mock.calls[0][0].shipping.address.line1).toBe(address.line1)
  })
  it('rejects cross-order status tokens, unpaid manufacturing, and mismatched totals; concurrent paid events create one draft', async () => {
    const { order } = await checkout()
    const session = paid(order)
    await expect(getStoreStatus(order.id,hashStoreValue(randomUUID()))).rejects.toThrow('unavailable')
    await fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:{ ...session,payment_status:'unpaid' } } })
    expect(mocks.provider).not.toHaveBeenCalled()
    // An interrupted paid worker can leave fulfillment pending. A late unpaid event cannot undo payment.
    await getDb().update(merchOrders).set({ paymentStatus:'paid',fulfillmentStatus:'pending' }).where(eq(merchOrders.id,order.id))
    await fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:{ ...session,payment_status:'unpaid' } } })
    const [stillPaid] = await getDb().select().from(merchOrders).where(eq(merchOrders.id,order.id))
    expect(stillPaid.paymentStatus).toBe('paid')
    await expect(fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:{ ...session,amount_total:1 } } })).rejects.toThrow('totals')
    await Promise.allSettled([1,2].map(() => fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:session } })))
    await fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:session } })
    expect(mocks.provider).toHaveBeenCalledTimes(1)
    expect(mocks.provider.mock.calls[0][1]).toMatchObject({ draft:true,recipient:{ email:order.customerEmail,address1:address.line1 } })
    const [saved] = await getDb().select().from(merchOrders).where(eq(merchOrders.id,order.id))
    expect(saved.paymentStatus).toBe('paid')
    expect(saved.fulfillmentStatus).toBe('printful_draft')
    const mail = await getDb().select().from(storeOutbox).where(eq(storeOutbox.orderId,order.id))
    expect(mail).toHaveLength(1)
  })
  it('recovers mail independently, merges packages and ignores stale regressions and duplicate shipment emails', async () => {
    const { order } = await checkout()
    await fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:paid(order) } })
    mocks.mail.mockResolvedValueOnce({ sent:false,error:'timeout' })
    await drainStoreOutbox()
    let [mail] = await getDb().select().from(storeOutbox).where(eq(storeOutbox.orderId,order.id))
    expect(mail.sentAt).toBeNull()
    await getDb().update(storeOutbox).set({ availableAt:new Date(0) }).where(eq(storeOutbox.key,mail.key))
    await drainStoreOutbox()
    ;[mail] = await getDb().select().from(storeOutbox).where(eq(storeOutbox.key,mail.key))
    expect(mail.sentAt).not.toBeNull()
    const [saved] = await getDb().select().from(merchOrders).where(eq(merchOrders.id,order.id))
    const pack = (id: number) => ({ id,tracking_number:`TRACK-${id}`,tracking_url:'https://example.com/track',shipped_at:1,items:[{ item_id:1,quantity:1 }] })
    remote = { id:saved.printfulOrderId,external_id:order.id.replaceAll('-',''),store_id:18931450,status:'partial',shipments:[pack(1)] }
    await reconcileStoreOrder(order.id)
    remote = { ...remote,status:'fulfilled',shipments:[pack(1),pack(2)] }
    await reconcileStoreOrder(order.id)
    remote = { ...remote,status:'draft',shipments:[] }
    await reconcileStoreOrder(order.id)
    const [final] = await getDb().select().from(merchOrders).where(eq(merchOrders.id,order.id))
    expect(final.providerStatus).toBe('fulfilled')
    expect(final.shipments).toHaveLength(2)
    const shipmentMail = await getDb().select().from(storeOutbox).where(and(eq(storeOutbox.orderId,order.id),like(storeOutbox.key,'shipment:%')))
    expect(shipmentMail).toHaveLength(2)
  })
  it('keeps refund totals monotonic across repeated and stale provider data', async () => {
    const { order } = await checkout()
    await fulfillMerchCheckoutEvent({ type:'checkout.session.completed',data:{ object:paid(order) } })
    const id = `pi_fixture_${order.id}`
    mocks.intent.mockResolvedValue({ livemode:false,latest_charge:{ amount_refunded:order.totalCents } })
    await syncStoreRefund(id)
    mocks.intent.mockResolvedValue({ livemode:false,latest_charge:{ amount_refunded:10 } })
    await syncStoreRefund(id)
    const [saved] = await getDb().select().from(merchOrders).where(eq(merchOrders.id,order.id))
    expect(saved.refundCents).toBe(order.totalCents)
    expect(saved.paymentStatus).toBe('refunded')
    expect(saved.fulfillmentStatus).toBe('printful_draft')
  })
  it('records a verified staff availability change atomically with actor and time', async () => {
    const db = getDb()
    const [admin] = await db.select({ id:profiles.id }).from(profiles).where(eq(profiles.role,'admin')).limit(1)
    if (!admin) throw new Error('Dev fixture requires an existing administrator.')
    const previous = await db.select().from(storeOverrides).where(eq(storeOverrides.id,mug))
    let auditId: string | undefined
    try {
      const receipt = await mutateAdminStore({ context:{ user:{ sub:admin.id }, db }, data:{ action:'availability',target:mug,value:false } })
      auditId = receipt.auditId
      const [audit] = await db.select().from(storeAudit).where(eq(storeAudit.id,auditId))
      expect(audit.actor).toBe(admin.id); expect(audit.target).toBe(mug); expect(audit.createdAt).toBeInstanceOf(Date)
      const [override] = await db.select().from(storeOverrides).where(eq(storeOverrides.id,mug))
      expect(override.enabled).toBe(false)
    } finally {
      if (auditId) await db.delete(storeAudit).where(eq(storeAudit.id,auditId))
      if (previous.length) await db.insert(storeOverrides).values(previous[0]).onConflictDoUpdate({ target:storeOverrides.id,set:previous[0] })
      else await db.delete(storeOverrides).where(eq(storeOverrides.id,mug))
    }
  })
  it('enforces durable concurrent limits', async () => {
    const key = `fixture-limit-${randomUUID()}`
    const results = await Promise.allSettled(Array.from({ length:4 },() => limitStoreRequest(key,2)))
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(2)
    expect(results.filter(r => r.status === 'rejected')).toHaveLength(2)
  })
})
