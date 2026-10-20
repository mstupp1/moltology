import Stripe from 'stripe'
import { neon } from '@neondatabase/serverless'
import type { MerchSeedProduct } from '../../src/lib/merch-seed-data'
import { isOrderablePrintfulId, MERCH_CHECKOUT_EVENT_TYPES } from '../../src/lib/merch'
import { PrintfulClient } from './printful-sync'
import { requireMerchDevDatabase } from './database'

export async function merchDoctor(products: MerchSeedProduct[]): Promise<boolean> {
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
    if (!key || !/^(sk|rk)_test_/.test(key)) throw new DoctorIssue('pilot requires a Stripe test secret/restricted key')
    const stripe = new Stripe(key)
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
    const valid = endpoints.data.some(endpoint => endpoint.status === 'enabled' &&
      new URL(endpoint.url).pathname === '/api/stripe/webhook' &&
      MERCH_CHECKOUT_EVENT_TYPES.every(event => endpoint.enabled_events.includes(event) || endpoint.enabled_events.includes('*')))
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new DoctorIssue('STRIPE_WEBHOOK_SECRET is missing; use Stripe CLI listen for local forwarding')
    return valid ? 'test key and hosted webhook configured' : 'test key and signing secret present; no matching hosted webhook (local CLI must be running)'
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
  return healthy
}
class DoctorIssue extends Error {}
