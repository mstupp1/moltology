import { describe, expect, it, vi } from 'vitest'
import { ensureGearCatalog, resetGearCatalogSync } from './gear-catalog'

function fakeDb(fail = false) {
  const execute = vi.fn(async () => {
    if (fail) throw new Error('down')
    return { rowCount: 0, rows: [] }
  })
  return { db: { execute } as unknown as Parameters<typeof ensureGearCatalog>[0], execute }
}

describe('ensureGearCatalog', () => {
  it('syncs once per server instance', async () => {
    resetGearCatalogSync()
    const { db, execute } = fakeDb()
    await Promise.all([ensureGearCatalog(db), ensureGearCatalog(db)])
    await ensureGearCatalog(db)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('tries again after a failed sync', async () => {
    resetGearCatalogSync()
    const bad = fakeDb(true)
    await expect(ensureGearCatalog(bad.db)).rejects.toThrow('down')
    const good = fakeDb()
    await ensureGearCatalog(good.db)
    expect(good.execute).toHaveBeenCalledTimes(1)
  })
})
