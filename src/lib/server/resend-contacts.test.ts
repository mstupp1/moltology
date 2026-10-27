import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getResendContact, moveResendContactToUsers, subscribeResendContact, unsubscribeResendContact } from './resend-contacts'
const fetchMock = vi.fn()
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  vi.stubEnv('RESEND_API_KEY', 'test-key')
  vi.stubEnv('RESEND_LEADS_SEGMENT_ID', 'leads')
  vi.stubEnv('RESEND_USERS_SEGMENT_ID', 'users')
  vi.stubEnv('RESEND_ALL_SUBSCRIBERS_SEGMENT_ID', 'all')
})
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('marketing contacts', () => {
  it('does not create a contact when a never-subscribed user opts out', async () => {
    fetchMock.mockResolvedValue(reply({}, 404))
    await unsubscribeResendContact(' Crab@Example.com ')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.resend.com/contacts/crab%40example.com')
  })
  it('creates inactive, assigns segments, and only then activates explicit consent', async () => {
    fetchMock.mockResolvedValueOnce(reply({}, 404)).mockResolvedValueOnce(reply({ id: 'c1' }))
      .mockImplementation(() => Promise.resolve(reply({ id: 'c1' })))
    await subscribeResendContact('Crab@Example.com', 'leads')
    const calls = fetchMock.mock.calls
    expect(JSON.parse(calls[1][1].body)).toEqual({ email: 'crab@example.com', unsubscribed: true })
    expect(calls.slice(2, 5).map(c => [c[0], c[1].method])).toEqual([
      ['https://api.resend.com/contacts/c1/segments/all', 'POST'],
      ['https://api.resend.com/contacts/c1/segments/leads', 'POST'],
      ['https://api.resend.com/contacts/c1/segments/users', 'DELETE'],
    ])
    expect(JSON.parse(calls[5][1].body)).toEqual({ unsubscribed: false })
  })
  it('moves a converted lead without resubscribing it', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(reply({ id: 'c1', unsubscribed: true })))
    await moveResendContactToUsers('crab@example.com')
    expect(fetchMock.mock.calls.some(c => c[1].method === 'PATCH')).toBe(false)
    expect(fetchMock.mock.calls[2][0]).toContain('/segments/users')
  })
  it('does not create a contact on conversion alone', async () => {
    fetchMock.mockResolvedValue(reply({}, 404))
    await moveResendContactToUsers('crab@example.com')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
  it('fails visibly before activation if assigning targeting fails', async () => {
    fetchMock.mockResolvedValueOnce(reply({ id: 'c1' })).mockResolvedValueOnce(reply({}, 429))
    await expect(subscribeResendContact('crab@example.com', 'users')).rejects.toThrow('Please try again')
    expect(fetchMock.mock.calls.some(c => c[1].method === 'PATCH')).toBe(false)
  })
  it('never exposes provider response bodies or API credentials in errors', async () => {
    fetchMock.mockResolvedValue(reply({ message: 'private provider detail' }, 403))
    await expect(getResendContact('crab@example.com')).rejects.toThrow('Could not update your email subscription')
  })
})
