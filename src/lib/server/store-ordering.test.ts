import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getDb } from '../../db'
import { STORE_DEFAULTS } from '../store'
import { STORE_ORDERING_CLOSED, createQuotedCheckout, createStoreQuote, requireStoreOrdering } from './store'

vi.mock('../../db', () => ({ getDb: vi.fn(() => ({})) }))

/** Every `.limit()` read answers in order: store settings first, then the viewer's profile. */
function storeDb(settings: Partial<typeof STORE_DEFAULTS>, profile?: { role: string; experiments?: string[] }) {
  const limit = vi.fn().mockResolvedValueOnce([{ value: { ...STORE_DEFAULTS, ...settings } }]).mockResolvedValue(profile ? [profile] : [])
  const query = { from: () => query, where: () => query, limit }
  const db = { select: vi.fn(() => query) }
  vi.mocked(getDb).mockReturnValue(db as never)
  return db
}
const as = (db: unknown, sub?: string) => ({ context: sub ? { user: { sub }, db: db as never } : null })

beforeEach(() => { vi.stubEnv('STORE_PUBLIC_LAUNCH_AUTHORIZED', 'true') })
afterEach(() => { vi.unstubAllEnvs() })

describe('store ordering switch', () => {
  it('lets anyone browse a public store but refuses quotes and checkout while ordering is closed', async () => {
    const guest = storeDb({ publicEnabled: true })
    await expect(createStoreQuote({ ...as(guest), data: {} })).rejects.toThrow(STORE_ORDERING_CLOSED)
    const member = storeDb({ publicEnabled: true }, { role: 'user' })
    await expect(createQuotedCheckout({ ...as(member, 'member-1'), data: {} })).rejects.toThrow(STORE_ORDERING_CLOSED)
  })

  it('still lets an admin order while it is closed, to test checkout', async () => {
    const admin = storeDb({ publicEnabled: true }, { role: 'admin' })
    await expect(requireStoreOrdering(as(admin, 'admin-1'))).resolves.toMatchObject({ settings: { orderingOpen: false } })
  })

  it('opens ordering to guests once the switch is on', async () => {
    const guest = storeDb({ publicEnabled: true, orderingOpen: true })
    await expect(requireStoreOrdering(as(guest))).resolves.toMatchObject({ auth: null })
  })

  it('pause checkout stops admins too', async () => {
    const admin = storeDb({ publicEnabled: true, checkoutPaused: true }, { role: 'admin' })
    await expect(requireStoreOrdering(as(admin, 'admin-1'))).rejects.toThrow('Checkout is paused.')
  })

  it('keeps a private store private even with ordering open', async () => {
    const member = storeDb({ publicEnabled: false, orderingOpen: true }, { role: 'user' })
    await expect(requireStoreOrdering(as(member, 'member-1'))).rejects.toThrow('This page is not available.')
  })
})
