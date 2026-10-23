import Stripe from 'stripe'
import { STRIPE_API_VERSION } from '../../src/lib/stripe-config'
import { neon } from '@neondatabase/serverless'
import type { MerchSeedProduct } from '../../src/lib/merch-seed-data'
import { isOrderablePrintfulId, MERCH_CHECKOUT_EVENT_TYPES } from '../../src/lib/merch'
import { PrintfulClient } from './printful-sync'
import { requireMerchDevDatabase } from './database'

export async function merchDoctor(products: MerchSeedProduct[], mode: 'test' | 'live' = 'test'): Promise<boolean> {
  let healthy = true
  async function check(label: string, run: () => Promise<string>) {
    try { console.log(`OK ${label}: ${await run()}`) }
    catch (error) {
      healthy = false
      // Only controlled diagnostic messages are displayed. Never dump SDK errors/configuration.
      console.log(`MISSING ${label}: ${error instanceof DoctorIssue ? error.message : 'check failed; verify access and connectivity'}`)
    }
  }
  await check('Printful', async () => {
    if (!process.env.PRINTFUL_API_TOKEN) throw new DoctorIssue('PRINTFUL_API_TOKEN is missing')
    const client = new PrintfulClient(process.env.PRINTFUL_API_TOKEN, process.env.PRINTFUL_STORE_ID)
    const stores = await client.stores()
    console.log(`  Accessible stores: ${stores.map(store => `${store.id} (${store.type})`).join(', ')}`)
    try { return `Manual/API store ${await client.requireManualStore()}` }
    catch { throw new DoctorIssue('create/select a Manual order platform/API store; set PRINTFUL_STORE_ID') }
  })
  await check('Stripe', async () => {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key || !(mode === 'live' ? /^(sk|rk)_live_/ : /^(sk|rk)_test_/).test(key)) throw new DoctorIssue(`expected a Stripe ${mode} secret/restricted key`)
    const stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION })
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    const valid = endpoints.data.some(endpoint => endpoint.status === 'enabled' &&
      new URL(endpoint.url).origin === new URL(process.env.BETTER_AUTH_URL || 'http://localhost:3000').origin && new URL(endpoint.url).pathname === '/api/stripe/webhook' &&
      [...MERCH_CHECKOUT_EVENT_TYPES, 'charge.refunded' as const, 'refund.created' as const, 'refund.updated' as const, 'refund.failed' as const].every(event => endpoint.enabled_events.includes(event) || endpoint.enabled_events.includes('*')))
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new DoctorIssue('STRIPE_WEBHOOK_SECRET is missing; use Stripe CLI listen for local forwarding')
    if (!valid && process.env.BETTER_AUTH_URL?.startsWith('https://')) throw new DoctorIssue('no matching hosted Stripe webhook with checkout and refund events')
    return valid ? `${mode} key and hosted webhook configured` : `${mode} key and signing secret present; no matching hosted webhook (local CLI must be running)`
  })
  await check('Database target', async () => {
    try { requireMerchDevDatabase(process.env) }
    catch { throw new DoctorIssue('DATABASE_URL must match DEV_DATABASE_URL or a verified NEON_DEV_ENDPOINT_ID') }
    return 'matches configured dev endpoint'
  })
  await check('Database schema', async () => {
    if (!process.env.DATABASE_URL) throw new DoctorIssue('DATABASE_URL is missing')
    const sql = neon(process.env.DATABASE_URL)
    // Read actual columns used by the pipeline; no migrations or writes.
    await sql`select p.id, p.slug, p."isPublished", v."printfulSyncVariantId", v."isAvailable", o."fulfillmentStatus", o."updatedAt", o."shippingAddress", o."lineItems", o."stripeCheckoutSessionId" from merch_products p left join merch_variants v on v."productId" = p.id left join merch_orders o on false limit 0`
    return 'merch tables reachable'
  })
  await check('Catalog', async () => {
    const missing = products.flatMap(product => product.variants).filter(variant => !isOrderablePrintfulId(variant.printfulSyncVariantId))
    if (missing.length) throw new DoctorIssue(`${missing.length} selected variants need Printful sync`)
    return `${products.length} products ready`
  })
  await check('Store operational schema', async () => {
    const sql = neon(process.env.DATABASE_URL!)
    await sql`select o."paymentStatus", o."quoteSnapshot", o."fulfillmentMode", o."shipments" from merch_orders o limit 0`
    await sql`select id from store_quotes limit 0`
    await sql`select key from store_outbox limit 0`
    return 'quotes, independent statuses, settings, and outbox migrated'
  })
  await check('Email and secure status', async () => {
    const missing = ['RESEND_API_KEY', 'RESEND_FROM_EMAIL', 'STORE_SUPPORT_INBOX', 'STORE_STATUS_SECRET'].filter(name => !process.env[name] || (name === 'STORE_STATUS_SECRET' && process.env[name]!.length < 32))
    if (missing.length) throw new DoctorIssue(`Missing: ${missing.join(', ')}. Verify sending domain and review real test emails.`)
    return 'configuration present; domain verification and delivery still require acceptance'
  })
  await check('Deployed callbacks and recovery', async () => {
    if ((process.env.PRINTFUL_WEBHOOK_SECRET?.length ?? 0) < 32 || (process.env.STORE_RECOVERY_SECRET?.length ?? 0) < 32)
      throw new DoctorIssue('configure private Printful callback URL and recovery bearer secret; enable GitHub Actions secrets')
    const origin = process.env.BETTER_AUTH_URL || ''
    if (!origin.startsWith('https://')) throw new DoctorIssue('deployed HTTPS origin is required; local listener does not prove hosted readiness')
    const response = await fetch('https://api.printful.com/webhooks', { headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID! } })
    if (!response.ok) throw new DoctorIssue('could not inspect Printful callback configuration')
    const body = await response.json() as { result?: { url?: string; types?: string[] } }
    const configured = body.result?.url ? new URL(body.result.url) : null
    if (!configured || configured.origin !== new URL(origin).origin || configured.pathname !== '/api/printful/webhook' || configured.searchParams.get('key') !== process.env.PRINTFUL_WEBHOOK_SECRET || !body.result?.types?.includes('package_shipped'))
      throw new DoctorIssue('Printful deployed store callback URL/events do not match this environment')
    const probe = await fetch(`${origin}/api/store/recovery`, { method: 'POST' })
    if (probe.status !== 401) throw new DoctorIssue('deployed recovery endpoint must reject unauthenticated requests')
    return 'Printful URL/events and protected recovery route verified; inspect latest scheduled run separately'
  })
  await check('Live US shipping rates', async () => {
    const { selectStandardRate } = await import('../../src/lib/store')
    const ledger = (await import('../../content/merch/printful-sync.json')).default
    if (String(ledger.storeId) !== process.env.PRINTFUL_STORE_ID) throw new DoctorIssue('Printful store differs from the approved mapping ledger')
    const selected = products.flatMap(product => product.variants).slice(0,1)
    const items = selected.map(variant => {
      const mapping = (ledger.variants as Record<string, { catalogVariantId: number; syncVariantId: number }>)[variant.id]
      if (!mapping || mapping.syncVariantId !== variant.printfulSyncVariantId) throw new DoctorIssue('selected variant needs an approved catalog shipping mapping')
      return { variant_id: mapping.catalogVariantId, quantity: 1 }
    })
    const response = await fetch('https://api.printful.com/shipping/rates', { method: 'POST',
      headers: { Authorization: `Bearer ${process.env.PRINTFUL_API_TOKEN}`, 'X-PF-Store-Id': process.env.PRINTFUL_STORE_ID!, 'Content-Type':'application/json' },
      body: JSON.stringify({ recipient: { address1:'19749 Dearborn St',city:'Chatsworth',state_code:'CA',country_code:'US',zip:'91311' }, items, currency:'USD' }), signal: AbortSignal.timeout(15_000) })
    if (!response.ok) throw new DoctorIssue('Printful did not return shipping rates')
    const body = await response.json() as { result?: Parameters<typeof selectStandardRate>[0] }
    try { const rate = selectStandardRate(body.result ?? []); return `${rate.service} USD quote verified using the documented fixture address; no order created` }
    catch { throw new DoctorIssue('no valid USD standard service returned') }
  })
  await check('Shipping and launch controls', async () => {
    const { readStoreSettings } = await import('../../src/lib/server/store')
    const settings = await readStoreSettings()
    console.log(`  Countries: ${settings.enabledCountries.join(', ')}; fulfillment: ${settings.fulfillmentMode}; checkout paused: ${settings.checkoutPaused}; public: ${settings.publicEnabled}`)
    if (!settings.policiesApproved || !settings.shippingPolicy || !settings.returnsPolicy || !settings.cancellationPolicy || !settings.supportEmail)
      throw new DoctorIssue('approved shipping/returns/cancellation/support details are launch blockers; do not invent policies')
    return 'approved policies configured; run live quote acceptance for every enabled country'
  })
  return healthy
}
class DoctorIssue extends Error {}
