import { INITIAL_MERCH_PRODUCTS } from '../../src/lib/merch-seed-data'
import { isOrderablePrintfulId } from '../../src/lib/merch'
export const APPROVED_STORE_SLUGS = ['moltology-mug', 'moltology-tee'] as const
export function requireProductionCatalogTarget(env: Record<string, string | undefined>, endpoint: string, authorization: string) {
  if (authorization !== 'approved-production-catalog') throw new Error('Explicit production catalog authorization is required.')
  if (!env.PROD_DATABASE_URL || !env.DATABASE_URL || env.DATABASE_URL !== env.PROD_DATABASE_URL) throw new Error('DATABASE_URL must equal the explicitly configured PROD_DATABASE_URL.')
  const host = new URL(env.PROD_DATABASE_URL).hostname.replace('-pooler.', '.')
  if (!host.endsWith('.neon.tech') || !endpoint || endpoint !== host.split('.')[0]) throw new Error('Pass the verified production endpoint ID.')
  if (env.DEV_DATABASE_URL && new URL(env.DEV_DATABASE_URL).hostname.replace('-pooler.', '.') === host) throw new Error('Production and dev endpoints must differ.')
  return env.PROD_DATABASE_URL
}
export async function promoteStoreCatalog(options: { execute: boolean; endpoint: string; authorization: string }) {
  const products = INITIAL_MERCH_PRODUCTS.filter(p => APPROVED_STORE_SLUGS.includes(p.slug as typeof APPROVED_STORE_SLUGS[number]))
  if (products.length !== 2 || products.some(p => p.variants.some(v => !isOrderablePrintfulId(v.printfulSyncVariantId)))) throw new Error('Approved catalog mappings are incomplete.')
  console.log(`${options.execute ? 'EXECUTE' : 'DRY RUN'}: selected approved mug and tee; seven variants. Operational settings and availability overrides are preserved.`)
  if (!options.execute) return
  const url = requireProductionCatalogTarget(process.env, options.endpoint, options.authorization)
  const { neon } = await import('@neondatabase/serverless')
  const { drizzle } = await import('drizzle-orm/neon-http')
  const schema = await import('../../src/db/schema')
  const { seedMerchCatalog } = await import('../../src/db/seed-merch')
  await seedMerchCatalog(drizzle(neon(url), { schema }), products, false)
  console.log('Approved catalog promoted. Public access and checkout settings were not changed.')
}
