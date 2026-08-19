import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { verifyTurnstileToken } from './turnstile'

describe('verifyTurnstileToken', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('rejects missing or empty token immediately without network call', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy

    const res1 = await verifyTurnstileToken({ token: '' })
    expect(res1.success).toBe(false)
    expect(res1.errorCodes).toContain('missing-input-response')

    const res2 = await verifyTurnstileToken({ token: null })
    expect(res2.success).toBe(false)

    const res3 = await verifyTurnstileToken({ token: '   ' })
    expect(res3.success).toBe(false)

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('rejects tokens that exceed maximum length (2048 chars)', async () => {
    const fetchSpy = vi.fn()
    globalThis.fetch = fetchSpy

    const longToken = 'a'.repeat(2050)
    const res = await verifyTurnstileToken({ token: longToken })
    expect(res.success).toBe(false)
    expect(res.errorCodes).toContain('invalid-token-length')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('successfully validates a valid Turnstile token', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        challenge_ts: '2026-08-18T19:00:00Z',
        hostname: 'moltology.com',
        action: 'submit_lead',
      }),
    }) as any

    const result = await verifyTurnstileToken({
      token: 'valid_token_123',
      ip: '127.0.0.1',
      expectedAction: 'submit_lead',
    })

    expect(result.success).toBe(true)
    expect(result.hostname).toBe('moltology.com')
    expect(result.action).toBe('submit_lead')
  })

  it('rejects when action does not match expectedAction', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        challenge_ts: '2026-08-18T19:00:00Z',
        hostname: 'moltology.com',
        action: 'other_action',
      }),
    }) as any

    const result = await verifyTurnstileToken({
      token: 'valid_token_123',
      expectedAction: 'submit_lead',
    })

    expect(result.success).toBe(false)
    expect(result.errorCodes).toContain('action-mismatch')
  })

  it('rejects when hostname does not match expectedHostnames list', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        challenge_ts: '2026-08-18T19:00:00Z',
        hostname: 'evil-phishing.com',
        action: 'submit_lead',
      }),
    }) as any

    const result = await verifyTurnstileToken({
      token: 'valid_token_123',
      expectedHostnames: ['moltology.com', 'localhost'],
    })

    expect(result.success).toBe(false)
    expect(result.errorCodes).toContain('hostname-mismatch')
  })

  it('handles Cloudflare rejection when token is invalid or expired', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    }) as any

    const result = await verifyTurnstileToken({
      token: 'bad_token_xyz',
    })

    expect(result.success).toBe(false)
    expect(result.errorCodes).toContain('invalid-input-response')
    expect(result.errorMessage).toBeDefined()
  })

  it('handles non-200 HTTP response gracefully', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as any

    const result = await verifyTurnstileToken({
      token: 'some_token',
    })

    expect(result.success).toBe(false)
    expect(result.errorCodes).toContain('http-status-500')
  })

  it('handles network error / exception gracefully without throwing', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Connection refused')) as any

    const result = await verifyTurnstileToken({
      token: 'some_token',
    })

    expect(result.success).toBe(false)
    expect(result.errorCodes).toContain('internal-error')
  })
})
