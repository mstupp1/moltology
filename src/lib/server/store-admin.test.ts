import { describe, expect, it, vi } from 'vitest'
import { getAdminStore, mutateAdminStore } from './store-operations'
vi.mock('../../db', () => ({ getDb: () => ({}) }))
describe('store administration server gate', () => {
  it('refuses unsigned admin reads and mutations', async () => {
    await expect(getAdminStore({})).rejects.toThrow('Authentication required')
    await expect(mutateAdminStore({ data:{ action:'retry',target:'order' } })).rejects.toThrow('Authentication required')
  })
  it('checks role from verified identity before any operational query', async () => {
    const limit = vi.fn().mockResolvedValue([{ role:'user' }])
    const db = { select: () => ({ from: () => ({ where: () => ({ limit }) }) }) }
    const context = { user:{ sub:'non-admin' },db:db as never }
    await expect(getAdminStore({ context })).rejects.toThrow('not available')
    await expect(mutateAdminStore({ context,data:{ action:'availability',target:'order',value:false } })).rejects.toThrow('not available')
    expect(limit).toHaveBeenCalledTimes(2)
  })
})
