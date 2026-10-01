import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(),
}))

import { getDb } from '../../db'
import { setPremiumAccessHandler } from './premium'

function rows(result: unknown[]) {
  const promise = Promise.resolve(result)
  const node: {
    from: () => typeof node
    where: () => typeof node
    limit: () => Promise<unknown[]>
    set: () => typeof node
    then: Promise<unknown[]>['then']
  } = {
    from: () => node,
    where: () => node,
    limit: () => promise,
    set: () => node,
    then: promise.then.bind(promise),
  }
  return node
}

function membershipDb(selectResults: unknown[][]) {
  const selects = [...selectResults]
  return {
    select: vi.fn(() => rows(selects.shift() ?? [])),
    update: vi.fn(() => rows([[]])),
  }
}

const freeMembership = {
  id: 'member-1',
  role: 'user',
  hasPurchasedPremium: false,
  isPremium: false,
  premiumStatus: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  premiumPeriodEnd: null,
  premiumSyncedAt: null,
}

describe('setPremiumAccessHandler staff gate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('refuses a signed-in member who is not staff', async () => {
    const db = membershipDb([[freeMembership]])
    vi.mocked(getDb).mockReturnValue(db as never)

    await expect(
      setPremiumAccessHandler({
        data: { action: 'grant' },
        context: { user: { sub: 'member-1', email: 'member@example.com', role: 'user' } },
      }),
    ).rejects.toThrow('This page is not available.')

    expect(db.update).not.toHaveBeenCalled()
  })

  it('lets staff activate Premium without a charge', async () => {
    const db = membershipDb([
      [{ ...freeMembership, id: 'staff-1', role: 'admin' }],
      [{ ...freeMembership, id: 'staff-1', role: 'admin' }],
    ])
    vi.mocked(getDb).mockReturnValue(db as never)

    await expect(
      setPremiumAccessHandler({
        data: { action: 'grant' },
        context: { user: { sub: 'staff-1', email: 'ops@example.com', role: 'admin' } },
      }),
    ).resolves.toEqual({ hasPurchasedPremium: true, isPremium: true })

    expect(db.update).toHaveBeenCalled()
  })
})
