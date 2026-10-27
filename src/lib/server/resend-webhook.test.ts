import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('./resend-contacts', () => ({ getResendContact: vi.fn() }))
vi.mock('./email-opt-in', () => ({ recordProviderUnsubscribe: vi.fn() }))
import { getResendContact } from './resend-contacts'
import { recordProviderUnsubscribe } from './email-opt-in'
import { handleResendWebhook, verifyResendWebhook } from './resend-webhook'
const secret = `whsec_${Buffer.from('a-test-signing-secret').toString('base64')}`
function signed(body: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signature = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`msg1.${timestamp}.${body}`).digest('base64')
  return new Headers({ 'svix-id': 'msg1', 'svix-timestamp': String(timestamp), 'svix-signature': `v1,${signature}` })
}
const event = JSON.stringify({ type: 'contact.updated', data: { email: 'crab@example.com', unsubscribed: true } })
function request(body = event) { return new Request('https://moltology.org/api/email/webhook', { method: 'POST', body, headers: signed(body) }) }
afterEach(() => { vi.resetAllMocks(); vi.unstubAllEnvs() })
describe('Resend unsubscribe webhook', () => {
  it('rejects tampered bodies and expired signatures', () => {
    expect(verifyResendWebhook(event, signed(event), secret)).toBe(true)
    expect(verifyResendWebhook(event + ' ', signed(event), secret)).toBe(false)
    expect(verifyResendWebhook(event, signed(event, 1), secret)).toBe(false)
  })
  it('updates local preference idempotently when provider is still unsubscribed', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', secret)
    vi.mocked(getResendContact).mockResolvedValue({ id: 'c1', email: 'crab@example.com', unsubscribed: true })
    for (let i = 0; i < 2; i++) expect((await handleResendWebhook(request())).status).toBe(200)
    expect(recordProviderUnsubscribe).toHaveBeenCalledWith('crab@example.com')
  })
  it('ignores stale unsubscribe events after a fresh opt-in', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', secret)
    vi.mocked(getResendContact).mockResolvedValue({ id: 'c1', email: 'crab@example.com', unsubscribed: false })
    expect((await handleResendWebhook(request())).status).toBe(200)
    expect(recordProviderUnsubscribe).not.toHaveBeenCalled()
  })
  it('never converts a provider subscribe event into local consent', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', secret)
    expect((await handleResendWebhook(request(event.replace('true', 'false')))).status).toBe(200)
    expect(getResendContact).not.toHaveBeenCalled()
  })
  it('returns an error so Resend retries a failed local update', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', secret)
    vi.mocked(getResendContact).mockRejectedValue(new Error('offline'))
    expect((await handleResendWebhook(request())).status).toBe(500)
  })
  it('rejects unsigned requests before touching contacts', async () => {
    vi.stubEnv('RESEND_WEBHOOK_SECRET', secret)
    expect((await handleResendWebhook(new Request('https://moltology.org', { method: 'POST', body: event }))).status).toBe(401)
    expect(getResendContact).not.toHaveBeenCalled()
  })
})
