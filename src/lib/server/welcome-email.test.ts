import { beforeEach, describe, expect, it, vi } from 'vitest'

const { select, limit, sendWelcomeEmail } = vi.hoisted(() => ({
  select: vi.fn(), limit: vi.fn(), sendWelcomeEmail: vi.fn(),
}))
vi.mock('../../db', () => ({ getDb: () => ({ select }) }))
vi.mock('./mail', () => ({ sendWelcomeEmail }))

import { isVerifiedGoogleSignup, sendWelcomeForVerifiedUser } from './welcome-email'

const user = { id: 'member-1', email: 'member@example.com', emailVerified: true }

describe('welcome eligibility', () => {
  it('recognizes verified Google OAuth and ID-token account creation', () => {
    expect(isVerifiedGoogleSignup(user, { path: '/callback/:id', params: { id: 'google' } })).toBe(true)
    expect(isVerifiedGoogleSignup(user, { path: '/sign-in/social', body: { provider: 'google' } })).toBe(true)
    expect(isVerifiedGoogleSignup({ ...user, emailVerified: false }, { path: '/callback/:id', params: { id: 'google' } })).toBe(false)
  })

  it.each([
    null, { path: '/sign-up/email' }, { path: '/sign-in/email' }, { path: '/link-social', body: { provider: 'google' } },
    { path: '/send-verification-email' }, { path: '/callback/:id', params: { id: 'github' } },
  ])('does not treat unrelated events as verified Google creation: %j', (context) => {
    expect(isVerifiedGoogleSignup(user, context)).toBe(false)
  })
})

describe('best-effort welcome delivery', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    select.mockReturnValue({ from: () => ({ where: () => ({ limit }) }) })
    limit.mockResolvedValue([{ isSimulated: false }])
    sendWelcomeEmail.mockResolvedValue({ sent: true })
  })

  it('sends one welcome to a verified real member', async () => {
    await sendWelcomeForVerifiedUser(user)
    expect(sendWelcomeEmail).toHaveBeenCalledExactlyOnceWith({ userId: user.id, to: user.email })
  })

  it('does not query or send for unverified users', async () => {
    await sendWelcomeForVerifiedUser({ ...user, emailVerified: false })
    expect(select).not.toHaveBeenCalled()
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
  })

  it.each([
    { name: 'simulated profile', rows: [{ isSimulated: true }] },
    { name: 'missing profile', rows: [] },
  ])('skips $name', async ({ rows }) => {
    limit.mockResolvedValue(rows)
    await sendWelcomeForVerifiedUser(user)
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
  })

  it('contains database lookup failures without attempting delivery', async () => {
    limit.mockRejectedValue(new Error('database unavailable'))
    await expect(sendWelcomeForVerifiedUser(user)).resolves.toBeUndefined()
    expect(sendWelcomeEmail).not.toHaveBeenCalled()
  })

  it('contains sender exceptions and rejected delivery without retrying', async () => {
    sendWelcomeEmail.mockRejectedValueOnce(new Error('unexpected sender failure'))
    await expect(sendWelcomeForVerifiedUser(user)).resolves.toBeUndefined()
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(1)
    sendWelcomeEmail.mockResolvedValueOnce({ sent: false, error: 'http-500' })
    await expect(sendWelcomeForVerifiedUser(user)).resolves.toBeUndefined()
    expect(sendWelcomeEmail).toHaveBeenCalledTimes(2)
  })
})
