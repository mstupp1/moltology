import { describe, expect, it, vi } from 'vitest'
import {
  adminOversightErrors,
  getAdminTelemetryHandler,
  listAdminPurchasesHandler,
  searchAdminMembersHandler,
  setAdminMemberRoleHandler,
} from './admin-oversight'

function rows(result: unknown[]) {
  const promise = Promise.resolve(result)
  const node: {
    from: () => typeof node
    leftJoin: () => typeof node
    where: () => typeof node
    orderBy: () => typeof node
    limit: () => Promise<unknown[]>
    set: () => typeof node
    returning: () => Promise<unknown[]>
    then: Promise<unknown[]>['then']
  } = {
    from: () => node,
    leftJoin: () => node,
    where: () => node,
    orderBy: () => node,
    limit: () => promise,
    set: () => node,
    returning: () => promise,
    then: promise.then.bind(promise),
  }
  return node
}

function staffDb(selectResults: unknown[][], updateResults: unknown[][] = []) {
  const selects = [...selectResults]
  const updates = [...updateResults]
  return {
    select: vi.fn(() => rows(selects.shift() ?? [])),
    update: vi.fn(() => rows(updates.shift() ?? [])),
  }
}

const staff = { sub: 'staff-1', email: 'ops@example.com' }

describe('admin oversight handlers', () => {
  it('rejects unauthenticated and non-admin readers', async () => {
    await expect(getAdminTelemetryHandler({ data: {}, context: {} })).rejects.toThrow('Unauthenticated')

    const db = staffDb([[{ role: 'user' }]])
    await expect(
      searchAdminMembersHandler({
        data: { query: 'claw' },
        context: { user: staff, db: db as never },
      }),
    ).rejects.toThrow(adminOversightErrors.denied)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('returns open flags, active sessions, and a healthy flag', async () => {
    const db = staffDb([[{ role: 'admin' }], [{ value: 4 }], [{ value: 9 }]])
    await expect(
      getAdminTelemetryHandler({ context: { user: staff, db: db as never } }),
    ).resolves.toEqual({
      pendingFlags: 4,
      activeSessions: 9,
      healthy: true,
    })
  })

  it('reports unhealthy status when the counts cannot be read', async () => {
    const db = {
      select: vi
        .fn()
        .mockImplementationOnce(() => rows([{ role: 'admin' }]))
        .mockImplementationOnce(() => {
          throw new Error('db down')
        }),
      update: vi.fn(),
    }
    await expect(
      getAdminTelemetryHandler({ context: { user: staff, db: db as never } }),
    ).resolves.toEqual({
      pendingFlags: 0,
      activeSessions: 0,
      healthy: false,
    })
  })

  it('returns recent members and purchase rows for staff', async () => {
    const member = {
      id: 'member-1',
      handle: 'claw_lord',
      larvaId: 'LARVA UNIT #12',
      email: 'claw@example.com',
      role: 'user',
      isPremium: true,
      hasPurchasedPremium: true,
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-02-03T00:00:00.000Z'),
    }
    const directoryDb = staffDb([[{ role: 'admin' }], [member]])
    const directory = await searchAdminMembersHandler({
      data: {},
      context: { user: staff, db: directoryDb as never },
    })
    expect(directory.members[0]).toMatchObject({
      id: 'member-1',
      email: 'claw@example.com',
      role: 'user',
      updatedAt: '2026-02-03T00:00:00.000Z',
    })

    const purchaseDb = staffDb([
      [{ role: 'admin' }],
      [
        {
          ...member,
          premiumStatus: 'active',
          premiumPeriodEnd: new Date('2026-04-01T00:00:00.000Z'),
          moltCredits: '12.50',
          chitinGems: 3,
        },
      ],
    ])
    const purchases = await listAdminPurchasesHandler({
      context: { user: staff, db: purchaseDb as never },
    })
    expect(purchases[0]).toMatchObject({
      moltCredits: '12.50',
      chitinGems: 3,
      premiumStatus: 'active',
      premiumPeriodEnd: '2026-04-01T00:00:00.000Z',
    })
  })

  it('lets an admin change clearance but not their own', async () => {
    const saved = staffDb(
      [[{ role: 'admin' }], [{ id: 'member-2', handle: 'reef', email: 'reef@example.com', role: 'user' }]],
      [[{ id: 'member-2', handle: 'reef', role: 'admin' }]],
    )
    await expect(
      setAdminMemberRoleHandler({
        data: { profileId: 'member-2', role: 'admin' },
        context: { user: staff, db: saved as never },
      }),
    ).resolves.toEqual({ id: 'member-2', handle: 'reef', role: 'admin' })
    expect(saved.update).toHaveBeenCalled()

    const selfDb = staffDb([[{ role: 'admin' }]])
    await expect(
      setAdminMemberRoleHandler({
        data: { profileId: 'staff-1', role: 'user' },
        context: { user: staff, db: selfDb as never },
      }),
    ).rejects.toThrow(adminOversightErrors.roleSelf)
    expect(selfDb.update).not.toHaveBeenCalled()
  })

  it('refuses the retired super_admin role and lets a stored super_admin act as admin', async () => {
    const legacyDb = staffDb([[{ role: 'super_admin' }]])
    await expect(
      setAdminMemberRoleHandler({
        data: { profileId: 'member-2', role: 'super_admin' },
        context: { user: staff, db: legacyDb as never },
      }),
    ).rejects.toThrow('Choose a valid clearance level.')
    expect(legacyDb.update).not.toHaveBeenCalled()
  })

  it('does not treat a listed email as staff', async () => {
    const db = staffDb([[{ role: 'user' }]])
    await expect(
      getAdminTelemetryHandler({
        context: { user: { sub: 'member-9', email: 'mylesstupp@gmail.com' }, db: db as never },
      }),
    ).rejects.toThrow(adminOversightErrors.denied)
  })
})
