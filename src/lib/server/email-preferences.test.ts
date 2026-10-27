import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ select: vi.fn(), update: vi.fn(), insert: vi.fn(), where: vi.fn(), values: vi.fn() }))
vi.mock('../../db', () => ({ getDb: () => mocks }))
vi.mock('./mail', () => ({ sendTransactionalEmail: vi.fn().mockResolvedValue({ sent: true }) }))
vi.mock('./resend-contacts', () => ({ subscribeResendContact: vi.fn(), unsubscribeResendContact: vi.fn(), moveResendContactToUsers: vi.fn(), getResendContact: vi.fn(), MARKETING_UPDATE_ERROR: 'Could not update subscription' }))
import { subscribeResendContact, unsubscribeResendContact, getResendContact, moveResendContactToUsers } from './resend-contacts'
import { sendTransactionalEmail } from './mail'
import { confirmSignupMarketing, handleMarketingSignup, requestEmailOptIn, setEmailPreference } from './email-opt-in'
import { resetRateLimits } from '../ai/guardrails'
const user = { id: 'u1', emailVerified: true, isSimulated: false }
function rows(...results: unknown[][]) {
  const limit = vi.fn()
  results.forEach(result => limit.mockResolvedValueOnce(result))
  limit.mockResolvedValue([])
  const query: any = { where: vi.fn(() => query), innerJoin: vi.fn(() => query), limit }
  mocks.select.mockReturnValue({ from: vi.fn(() => query) })
}
beforeEach(() => {
  vi.clearAllMocks(); resetRateLimits()
  mocks.where.mockResolvedValue([])
  mocks.update.mockReturnValue({ set: vi.fn(() => ({ where: mocks.where })) })
  mocks.insert.mockReturnValue({ values: mocks.values.mockResolvedValue([]) })
})
afterEach(() => vi.unstubAllEnvs())
describe('shared marketing preference events', () => {
  it('subscribes a verified member and updates both local representations', async () => {
    rows([user], [user])
    expect(await setEmailPreference('crab@example.com', true, 'settings_page')).toEqual({ status: 'subscribed' })
    expect(subscribeResendContact).toHaveBeenCalledWith('crab@example.com', 'users')
    expect(mocks.update).toHaveBeenCalledTimes(2)
  })
  it('requires confirmation for an unverified member and creates no Resend contact', async () => {
    rows([{ ...user, emailVerified: false }], [])
    expect(await setEmailPreference('crab@example.com', true, 'settings_page')).toEqual({ status: 'pending' })
    expect(subscribeResendContact).not.toHaveBeenCalled()
    expect(sendTransactionalEmail).toHaveBeenCalled()
  })
  it('does not save local success when the provider fails', async () => {
    rows([user])
    vi.mocked(unsubscribeResendContact).mockRejectedValueOnce(new Error('offline'))
    await expect(setEmailPreference('crab@example.com', false, 'settings_page')).rejects.toThrow()
    expect(mocks.update).not.toHaveBeenCalled()
  })
  it('does not subscribe simulated members', async () => {
    rows([{ ...user, isSimulated: true }])
    await expect(setEmailPreference('fake@example.com', true, 'settings_page')).rejects.toThrow()
    expect(subscribeResendContact).not.toHaveBeenCalled()
  })
  it('reports confirmation delivery failure without opting in', async () => {
    rows([])
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce({ sent: false })
    expect(await requestEmailOptIn('crab@example.com', 'guide')).toEqual({ status: 'error' })
    expect(subscribeResendContact).not.toHaveBeenCalled()
  })
  it('stores signup intent without sending a second confirmation when verification is enabled', async () => {
    rows([], [])
    await handleMarketingSignup({ id: 'u1', email: 'crab@example.com', emailVerified: false }, true, true)
    expect(sendTransactionalEmail).not.toHaveBeenCalled()
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({ source: 'signup', emailOptIn: false }))
  })
  it('activates stored signup consent on verification', async () => {
    rows([{ emailOptInSource: 'signup_pending' }], [{ emailOptIn: false, emailOptInAt: new Date() }], [user], [user])
    await confirmSignupMarketing({ id: 'u1', email: 'crab@example.com' })
    expect(subscribeResendContact).toHaveBeenCalledWith('crab@example.com', 'users')
  })
  it('cannot activate signup consent after withdrawal cleared the pending request', async () => {
    rows([{ emailOptInSource: 'signup_pending' }], [{ emailOptIn: false, emailOptInAt: null }])
    await confirmSignupMarketing({ id: 'u1', email: 'crab@example.com' })
    expect(subscribeResendContact).not.toHaveBeenCalled()
  })
  it('converts an unsubscribed lead without reactivating it', async () => {
    rows([{ emailOptIn: true }], [user])
    vi.mocked(getResendContact).mockResolvedValueOnce({ id: 'c1', email: 'crab@example.com', unsubscribed: true })
    await handleMarketingSignup({ id: 'u1', email: 'crab@example.com' }, false, false)
    expect(moveResendContactToUsers).toHaveBeenCalled()
    expect(subscribeResendContact).not.toHaveBeenCalled()
  })
  it('creates no contact for an unchecked signup without a previous subscription', async () => {
    rows([])
    await handleMarketingSignup({ id: 'u1', email: 'crab@example.com' }, false, false)
    expect(getResendContact).not.toHaveBeenCalled()
    expect(subscribeResendContact).not.toHaveBeenCalled()
  })
})
