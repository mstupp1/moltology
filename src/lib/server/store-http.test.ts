import { afterEach, describe, expect, it, vi } from 'vitest'
import { handlePrintfulWebhookRequest, handleStoreRecoveryRequest } from './store-http'
import { hashStoreValue, secretMatches, storeStatusToken } from './store'
import { getDb } from '../../db'
vi.mock('../../db', () => ({ getDb: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
describe('store endpoint authentication', () => {
  it('refuses recovery with missing, short or incorrect secrets before database access', async () => {
    for (const secret of ['', 'short', 'x'.repeat(32)]) {
      vi.stubEnv('STORE_RECOVERY_SECRET',secret)
      const result = await handleStoreRecoveryRequest(new Request('https://example.com/api/store/recovery',{ method:'POST',headers:{ authorization:'Bearer wrong' } }))
      expect(result.status).toBe(401)
    }
    expect(getDb).not.toHaveBeenCalled()
  })
  it('refuses callback triggers without a valid bearer URL token', async () => {
    vi.stubEnv('PRINTFUL_WEBHOOK_SECRET','x'.repeat(32))
    const result = await handlePrintfulWebhookRequest(new Request('https://example.com/api/printful/webhook?key=wrong',{ method:'POST',body:'{}' }))
    expect(result.status).toBe(401)
    expect(getDb).not.toHaveBeenCalled()
  })
  it('rejects callbacks for a different store and invalid payloads before remote reads', async () => {
    const key = 'x'.repeat(32)
    vi.stubEnv('PRINTFUL_WEBHOOK_SECRET',key); vi.stubEnv('PRINTFUL_STORE_ID','18931450')
    for (const body of ['{','null',JSON.stringify({ store:123,data:{ order:{ id:1 } } }),JSON.stringify({ store:18931450,data:{} })]) {
      const result = await handlePrintfulWebhookRequest(new Request(`https://example.com/api/printful/webhook?key=${key}`,{ method:'POST',body }))
      expect(result.status).toBe(400)
    }
    expect(getDb).not.toHaveBeenCalled()
  })
  it('uses distinct deterministic high-entropy status capabilities per order', () => {
    vi.stubEnv('STORE_STATUS_SECRET','private-status-key-at-least-32-characters')
    const a = storeStatusToken('a'), b = storeStatusToken('b')
    expect(a).toMatch(/^[a-f0-9]{64}$/); expect(a).not.toBe(b); expect(storeStatusToken('a')).toBe(a)
    expect(hashStoreValue(a)).not.toBe(a)
    expect(secretMatches(a,a)).toBe(true); expect(secretMatches(a,b)).toBe(false)
  })
})
