import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimits } from '../ai/guardrails'
import { SUPPORT_TICKET_COPY, SUPPORT_TICKET_HONEYPOT_FIELD } from '../support-tickets'

vi.mock('../user-sync', () => ({
  ensureUserProfile: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../db', () => ({
  getDb: vi.fn(() => ({ mocked: true })),
}))

vi.mock('./turnstile', () => ({
  verifyTurnstileToken: vi.fn(),
}))

vi.mock('./mail', () => ({
  sendSupportTicketEmail: vi.fn(),
}))

import { createSupportTicketHandler, hashClientIp } from './support-tickets'
import { verifyTurnstileToken } from './turnstile'
import { sendSupportTicketEmail } from './mail'

const MEMBER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const TICKET_ID = '7c2f1a90-3d44-4c1a-9b11-0f8c2e6a1111'

function createMockDb(opts?: { recentCount?: number; handle?: string | null }) {
  const recent = Array.from({ length: opts?.recentCount ?? 0 }, (_, i) => ({ id: `recent-${i}` }))
  const inserted = {
    id: TICKET_ID,
    userId: MEMBER_ID,
    handle: opts?.handle ?? 'claw_lord',
    subject: 'Chassis freeze',
    body: 'The vault would not open after a greaves swap.',
    category: 'SHELL_INTEGRITY',
    urgency: 'NORMAL',
    status: 'open',
  }

  return {
    select: vi.fn().mockImplementation(() => ({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          const whereResult = Promise.resolve(recent)
          return Object.assign(whereResult, {
            limit: vi.fn().mockResolvedValue([{ handle: opts?.handle ?? 'claw_lord', larvaId: 'LARVA UNIT #1' }]),
          })
        }),
      }),
    })),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([inserted]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    }),
  }
}

const validData = {
  subject: 'Chassis freeze',
  body: 'The vault would not open after a greaves swap.',
  category: 'SHELL_INTEGRITY' as const,
  urgency: 'NORMAL' as const,
  turnstileToken: 'turnstile-ok',
}

describe('createSupportTicketHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true })
    vi.mocked(sendSupportTicketEmail).mockResolvedValue({ sent: true })
  })

  it('rejects unauthenticated guests before writing', async () => {
    const mockDb = createMockDb()
    await expect(
      createSupportTicketHandler({
        data: validData,
        context: { db: mockDb as any },
      }),
    ).rejects.toThrow(SUPPORT_TICKET_COPY.unauthenticated)
    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(sendSupportTicketEmail).not.toHaveBeenCalled()
  })

  it('swallows honeypot fills without creating a ticket or sending mail', async () => {
    const mockDb = createMockDb()
    const result = await createSupportTicketHandler({
      data: {
        ...validData,
        [SUPPORT_TICKET_HONEYPOT_FIELD]: 'http://spam.test',
      },
      context: { user: { sub: MEMBER_ID, email: 'claw@moltology.org' }, db: mockDb as any },
    })

    expect(result).toEqual({ success: true, ticketId: null, ticketReference: null })
    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(sendSupportTicketEmail).not.toHaveBeenCalled()
  })

  it('rejects missing Turnstile tokens', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue({
      success: false,
      errorMessage: SUPPORT_TICKET_COPY.botCheckFailed,
    })
    const mockDb = createMockDb()
    await expect(
      createSupportTicketHandler({
        data: { ...validData, turnstileToken: undefined },
        context: { user: { sub: MEMBER_ID }, db: mockDb as any },
      }),
    ).rejects.toThrow(SUPPORT_TICKET_COPY.botCheckFailed)
    expect(mockDb.insert).not.toHaveBeenCalled()
  })

  it('strips HTML, inserts the member row, and emails only the support inbox payload', async () => {
    const mockDb = createMockDb()
    const values = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([
        {
          id: TICKET_ID,
          userId: MEMBER_ID,
          handle: 'claw_lord',
        },
      ]),
    })
    mockDb.insert = vi.fn().mockReturnValue({ values })

    const result = await createSupportTicketHandler({
      data: {
        ...validData,
        subject: '<b>Chassis</b> freeze',
        body: '<script>alert(1)</script>The vault would not open after a greaves swap.',
        to: 'attacker@evil.test',
        recipient: 'other@evil.test',
      },
      context: {
        user: { sub: MEMBER_ID, email: 'claw@moltology.org' },
        db: mockDb as any,
        clientIp: '203.0.113.9',
      },
    })

    expect(result).toEqual({
      success: true,
      ticketId: TICKET_ID,
      ticketReference: TICKET_ID,
    })
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: MEMBER_ID,
        handle: 'claw_lord',
        subject: 'Chassis freeze',
        body: 'alert(1)The vault would not open after a greaves swap.',
        category: 'SHELL_INTEGRITY',
        ipHash: hashClientIp('203.0.113.9'),
      }),
    )
    expect(sendSupportTicketEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketId: TICKET_ID,
        memberId: MEMBER_ID,
        handle: 'claw_lord',
        memberEmail: 'claw@moltology.org',
        subject: 'Chassis freeze',
        to: 'attacker@evil.test',
        recipient: 'other@evil.test',
      }),
    )
    expect(mockDb.update).toHaveBeenCalled()
  })

  it('rate-limits a member who already has three recent tickets', async () => {
    const mockDb = createMockDb({ recentCount: 3 })
    await expect(
      createSupportTicketHandler({
        data: validData,
        context: { user: { sub: MEMBER_ID }, db: mockDb as any },
      }),
    ).rejects.toThrow(SUPPORT_TICKET_COPY.rateLimited)
    expect(mockDb.insert).not.toHaveBeenCalled()
    expect(sendSupportTicketEmail).not.toHaveBeenCalled()
  })

  it('still returns the ticket when mail is skipped', async () => {
    vi.mocked(sendSupportTicketEmail).mockResolvedValue({ sent: false, skipped: true, error: 'missing-api-key' })
    const mockDb = createMockDb()
    const result = await createSupportTicketHandler({
      data: validData,
      context: { user: { sub: MEMBER_ID }, db: mockDb as any },
    })
    expect(result.ticketId).toBe(TICKET_ID)
    expect(mockDb.update).not.toHaveBeenCalled()
  })
})
