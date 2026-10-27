import { beforeEach, describe, expect, it, vi } from 'vitest'

const dbMock = { update: vi.fn(), select: vi.fn() }
vi.mock('./resend-contacts', () => ({ subscribeResendContact: vi.fn(), getResendContact: vi.fn(), moveResendContactToUsers: vi.fn(), unsubscribeResendContact: vi.fn(), MARKETING_UPDATE_ERROR: 'Could not update your email subscription.' }))
vi.mock('../../db', () => ({ getDb: vi.fn(() => dbMock) }))
vi.mock('./mail', () => ({ sendTransactionalEmail: vi.fn() }))

import { subscribeResendContact } from './resend-contacts'
import {
  createEmailOptInToken,
  EMAIL_OPT_IN_TTL_MS,
  handleEmailOptInConfirm,
  verifyEmailOptInToken,
} from './email-opt-in'

const SECRET = 'test-secret-at-least-16'

describe('email opt-in tokens', () => {
  it('round-trips the normalized address until it expires', () => {
    const now = 1_000_000
    const token = createEmailOptInToken(' Crab@Example.com ', now, SECRET)
    expect(verifyEmailOptInToken(token, now + 1000, SECRET)).toBe('crab@example.com')
    expect(verifyEmailOptInToken(token, now + EMAIL_OPT_IN_TTL_MS + 1, SECRET)).toBeNull()
  })

  it('rejects tampered or foreign tokens', () => {
    const token = createEmailOptInToken('crab@example.com', 0, SECRET)
    const [, signature] = token.split('.')
    const forged = `${Buffer.from(JSON.stringify({ e: 'victim@example.com', x: Date.now() + 1e9 })).toString('base64url')}.${signature}`
    expect(verifyEmailOptInToken(forged, 1, SECRET)).toBeNull()
    expect(verifyEmailOptInToken(token, 1, 'another-secret-value')).toBeNull()
    expect(verifyEmailOptInToken('garbage', 1, SECRET)).toBeNull()
    expect(verifyEmailOptInToken(null, 1, SECRET)).toBeNull()
  })
})

describe('handleEmailOptInConfirm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMock.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
  })

  it('opts in a confirmed address and redirects to /org', async () => {
    const now = Date.now()
    const token = createEmailOptInToken('crab@example.com', now)
    const limit = vi.fn().mockResolvedValueOnce([{ emailOptInAt: new Date(now), emailOptIn: false }]).mockResolvedValue([])
    const query: any = { where: vi.fn(() => query), limit, innerJoin: vi.fn(() => query) }
    dbMock.select.mockReturnValue({ from: vi.fn(() => query) })
    const res = await handleEmailOptInConfirm(new Request(`https://moltology.org/api/email/confirm?token=${token}`))
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/org?email=confirmed')
    expect(subscribeResendContact).toHaveBeenCalledWith('crab@example.com', 'leads')
    expect(dbMock.update).toHaveBeenCalledTimes(1)
  })

  it('does not activate a revoked or superseded request', async () => {
    const token = createEmailOptInToken('crab@example.com')
    dbMock.select.mockReturnValue({ from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn().mockResolvedValue([{ emailOptInAt: null }]) })) })) })
    const res = await handleEmailOptInConfirm(new Request(`https://moltology.org/api/email/confirm?token=${token}`))
    expect(res.headers.get('Location')).toBe('/org?email=expired')
    expect(subscribeResendContact).not.toHaveBeenCalled()
  })

  it('does nothing for a bad link', async () => {
    const res = await handleEmailOptInConfirm(new Request('https://moltology.org/api/email/confirm?token=nope'))
    expect(res.headers.get('Location')).toBe('/org?email=expired')
    expect(dbMock.update).not.toHaveBeenCalled()
  })
})
