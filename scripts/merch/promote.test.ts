import { afterEach, describe, expect, it, vi } from 'vitest'
import { APPROVED_STORE_SLUGS, promoteStoreCatalog, requireProductionCatalogTarget } from './promote'
afterEach(() => vi.restoreAllMocks())
const prod = 'postgres://user:password@ep-prod.us-east-1.aws.neon.tech/db'
const env = { DATABASE_URL: prod, PROD_DATABASE_URL: prod, DEV_DATABASE_URL: 'postgres://user:password@ep-dev.us-east-1.aws.neon.tech/db' }
describe('production catalog promotion fence', () => {
  it('only selects the approved pair and dry-run needs no production credentials', async () => {
    vi.spyOn(console,'log').mockImplementation(() => {})
    expect(APPROVED_STORE_SLUGS).toEqual(['moltology-mug','moltology-tee'])
    await expect(promoteStoreCatalog({ execute:false, endpoint:'', authorization:'' })).resolves.toBeUndefined()
  })
  it('requires explicit execution authorization and exact verified production configuration', () => {
    expect(() => requireProductionCatalogTarget(env,'ep-prod','')).toThrow('authorization')
    expect(() => requireProductionCatalogTarget(env,'ep-dev','approved-production-catalog')).toThrow('endpoint')
    expect(() => requireProductionCatalogTarget({ ...env, DATABASE_URL: env.DEV_DATABASE_URL },'ep-prod','approved-production-catalog')).toThrow('equal')
    expect(() => requireProductionCatalogTarget({ ...env, DEV_DATABASE_URL: prod },'ep-prod','approved-production-catalog')).toThrow('differ')
    expect(requireProductionCatalogTarget(env,'ep-prod','approved-production-catalog')).toBe(prod)
  })
})
