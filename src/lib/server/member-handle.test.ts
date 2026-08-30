import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

import { claimMemberHandleHandler } from './api'
import { HANDLE_MESSAGES, HANDLE_TAKEN_MESSAGE } from '../member-handle'

const MEMBER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MEMBER_B = '753a434e-b4c6-4681-9f6c-db3e5e5ca284'

function mockDb(options: {
  takenId?: string | null
  updated?: Record<string, unknown> | null
  updateError?: Error
}) {
  const selectLimit = vi.fn().mockResolvedValue(options.takenId ? [{ id: options.takenId }] : [])
  const returning = options.updateError
    ? vi.fn().mockRejectedValue(options.updateError)
    : vi.fn().mockResolvedValue(options.updated ? [options.updated] : [])
  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          limit: selectLimit,
        })),
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockImplementation(() => ({
          returning,
        })),
      })),
    })),
    selectLimit,
  }
}

describe('claimMemberHandleHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects reserved designations without writing', async () => {
    const db = mockDb({})
    await expect(
      claimMemberHandleHandler({
        data: { handle: 'oracle' },
        context: { user: { sub: MEMBER_A }, db: db as any },
      }),
    ).rejects.toThrow(HANDLE_MESSAGES.reserved)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('rejects a designation already held by another member', async () => {
    const db = mockDb({ takenId: MEMBER_B })
    await expect(
      claimMemberHandleHandler({
        data: { handle: 'claw_lord' },
        context: { user: { sub: MEMBER_A }, db: db as any },
      }),
    ).rejects.toThrow(HANDLE_TAKEN_MESSAGE)
    expect(db.update).not.toHaveBeenCalled()
  })

  it('seals a valid unique designation on the existing profile', async () => {
    const db = mockDb({
      updated: {
        handle: 'claw_lord',
        larvaId: 'LARVA UNIT #2468',
      },
    })
    const res = await claimMemberHandleHandler({
      data: { handle: 'claw_lord' },
      context: { user: { sub: MEMBER_A }, db: db as any },
    })
    expect(res.handle).toBe('claw_lord')
    expect(res.displayName).toBe('claw_lord')
    expect(res.larvaId).toBe('LARVA UNIT #2468')
    expect(db.update).toHaveBeenCalled()
  })

  it('treats a unique-index race as taken rather than coercing', async () => {
    const db = mockDb({
      updateError: Object.assign(new Error('duplicate key value violates unique constraint "profiles_handle_lower_uidx"'), {
        code: '23505',
      }),
    })
    await expect(
      claimMemberHandleHandler({
        data: { handle: 'claw_lord' },
        context: { user: { sub: MEMBER_A }, db: db as any },
      }),
    ).rejects.toThrow(HANDLE_TAKEN_MESSAGE)
  })
})
