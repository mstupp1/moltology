import { describe, expect, it, vi } from 'vitest'
import { SIGNUP_HONEYPOT_MESSAGE } from '../signup-telemetry'
import { readEmailSignupGate } from './signup-gate'

function signupRequest(body: Record<string, unknown>): Request {
  return new Request('https://moltology.org/api/auth/sign-up/email', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'cf-ipcountry': 'US',
    },
    body: JSON.stringify(body),
  })
}

describe('email signup gate', () => {
  it('passes non-signup requests without telemetry', async () => {
    const request = new Request('https://moltology.org/api/auth/sign-in/email', { method: 'POST' })
    await expect(readEmailSignupGate(request)).resolves.toEqual({ kind: 'pass', telemetry: null })
  })

  it('passes a blank honeypot and keeps a fast completion as telemetry', async () => {
    const gate = await readEmailSignupGate(signupRequest({ email: 'ada@example.com', confirm_website: '', signupElapsedMs: 400 }))
    expect(gate).toEqual({ kind: 'pass', telemetry: { elapsedMs: 400, fast: true } })
  })

  it('rejects a filled honeypot without calling the model and records the event', async () => {
    const record = vi.fn().mockResolvedValue(undefined)
    const gate = await readEmailSignupGate(
      signupRequest({ email: 'bot@mailinator.com', confirm_website: 'https://spam.example', signupElapsedMs: 100 }),
      { record },
    )
    expect(gate.kind).toBe('reject')
    if (gate.kind !== 'reject') return
    expect(gate.response.status).toBe(400)
    await expect(gate.response.json()).resolves.toEqual({ message: SIGNUP_HONEYPOT_MESSAGE })
    expect(record).toHaveBeenCalledWith(expect.objectContaining({
      action: 'block',
      reason: 'honeypot',
      userId: null,
      emailDomain: 'mailinator.com',
      country: 'US',
      fastSubmission: true,
    }))
  })
})
