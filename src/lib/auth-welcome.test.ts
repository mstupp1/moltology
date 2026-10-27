import { beforeEach, describe, expect, it, vi } from 'vitest'

const { welcome, ensureProfile, persistSignup, signupMarketing, confirmMarketing } = vi.hoisted(() => ({
  welcome: vi.fn(), ensureProfile: vi.fn(), persistSignup: vi.fn(), signupMarketing: vi.fn(), confirmMarketing: vi.fn(),
}))
vi.mock('./server/welcome-email', async (importOriginal) => ({
  ...await importOriginal<typeof import('./server/welcome-email')>(),
  sendWelcomeForVerifiedUser: welcome,
}))
vi.mock('./user-sync', () => ({ ensureUserProfile: ensureProfile }))
vi.mock('./server/signup-auth', async (importOriginal) => ({
  ...await importOriginal<typeof import('./server/signup-auth')>(),
  persistAdmittedSignup: persistSignup,
}))
vi.mock('./server/email-opt-in', () => ({ handleMarketingSignup: signupMarketing, confirmSignupMarketing: confirmMarketing }))

import { auth } from './auth-server'

const user = { id: 'member-1', email: 'member@example.com', name: 'Member', emailVerified: true,
  createdAt: new Date(0), updatedAt: new Date(0) }
const afterCreation = auth.options.databaseHooks!.user!.create!.after!
const afterVerification = auth.options.emailVerification!.afterEmailVerification!
type CreationContext = Parameters<typeof afterCreation>[1]

describe('automatic welcome auth hooks', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    welcome.mockResolvedValue(undefined)
  })

  it('welcomes a newly verified email account without changing the existing consent callback', async () => {
    await afterVerification(user)
    expect(confirmMarketing).toHaveBeenCalledExactlyOnceWith(user)
    expect(welcome).toHaveBeenCalledExactlyOnceWith(user)
  })

  it('welcomes a new verified Google user after profile creation', async () => {
    await afterCreation(user, { path: '/callback/:id', params: { id: 'google' } } as unknown as CreationContext)
    expect(ensureProfile).toHaveBeenCalledExactlyOnceWith(user.id)
    expect(welcome).toHaveBeenCalledExactlyOnceWith(user)
    expect(ensureProfile.mock.invocationCallOrder[0]).toBeLessThan(welcome.mock.invocationCallOrder[0])
  })

  it('also handles a new verified Google account created through ID-token sign-in', async () => {
    await afterCreation(user, { path: '/sign-in/social', body: { provider: 'google' } } as unknown as CreationContext)
    expect(welcome).toHaveBeenCalledExactlyOnceWith(user)
  })

  it('does not welcome an unverified password signup', async () => {
    await afterCreation({ ...user, emailVerified: false }, { path: '/sign-up/email' } as unknown as CreationContext)
    expect(welcome).not.toHaveBeenCalled()
  })

  it.each(['/sign-in/email', '/link-social', '/send-verification-email'])('does not send a welcome from %s', async (path) => {
    await afterCreation(user, { path } as unknown as CreationContext)
    expect(welcome).not.toHaveBeenCalled()
  })

  it('keeps the welcome independent of a marketing confirmation failure', async () => {
    confirmMarketing.mockRejectedValue(new Error('marketing unavailable'))
    await expect(afterVerification(user)).resolves.toBeUndefined()
    expect(welcome).toHaveBeenCalledExactlyOnceWith(user)
  })

  it('keeps the welcome independent of a signup marketing failure', async () => {
    signupMarketing.mockRejectedValue(new Error('marketing unavailable'))
    await expect(afterCreation(user, { path: '/callback/:id', params: { id: 'google' } } as unknown as CreationContext)).resolves.toBeUndefined()
    expect(welcome).toHaveBeenCalledExactlyOnceWith(user)
  })
})
