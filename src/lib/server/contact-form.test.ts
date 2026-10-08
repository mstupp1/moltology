import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRateLimits } from '../ai/guardrails'
import { CONTACT_COPY, CONTACT_EMAIL_LIMIT, CONTACT_HONEYPOT_FIELD, CONTACT_TURNSTILE_ACTION } from '../contact-form'

const dbMock = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}

vi.mock('../../db', () => ({
  getDb: vi.fn(() => dbMock),
}))

vi.mock('./turnstile', () => ({
  verifyTurnstileToken: vi.fn(),
}))

vi.mock('./mail', () => ({
  sendContactFormEmail: vi.fn(),
}))

import { submitContactFormHandler } from './contact-form'
import { verifyTurnstileToken } from './turnstile'
import { sendContactFormEmail } from './mail'

const validData = {
  name: 'Tester Crab',
  email: 'Crab@Example.com ',
  topic: 'visit',
  message: 'Requesting permission to tour Chamber 04.',
  turnstileToken: 'turnstile-ok',
}

function mockLeadLookup(rows: unknown[]) {
  const values = vi.fn().mockResolvedValue([])
  dbMock.select.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue(rows) }),
    }),
  })
  dbMock.insert.mockReturnValue({ values })
  dbMock.update.mockReturnValue({ set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
  return values
}

describe('submitContactFormHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetRateLimits()
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true })
    vi.mocked(sendContactFormEmail).mockResolvedValue({ sent: true })
  })

  it('emails the message with the normalized sender and topic', async () => {
    const result = await submitContactFormHandler({ data: validData, context: { clientIp: '1.2.3.4' } })

    expect(result).toEqual({ success: true })
    expect(verifyTurnstileToken).toHaveBeenCalledWith(
      expect.objectContaining({ token: 'turnstile-ok', expectedAction: CONTACT_TURNSTILE_ACTION, ip: '1.2.3.4' }),
    )
    expect(sendContactFormEmail).toHaveBeenCalledWith({
      name: 'Tester Crab',
      email: 'crab@example.com',
      topic: 'visit',
      message: 'Requesting permission to tour Chamber 04.',
    })
    expect(dbMock.insert).not.toHaveBeenCalled()
  })

  it('falls back to the general topic for unknown values', async () => {
    await submitContactFormHandler({ data: { ...validData, topic: 'liquidation' } })
    expect(sendContactFormEmail).toHaveBeenCalledWith(expect.objectContaining({ topic: 'general' }))
  })

  it('throws when the email could not be sent, since nothing is stored', async () => {
    vi.mocked(sendContactFormEmail).mockResolvedValue({ sent: false, error: 'http-500' })
    await expect(submitContactFormHandler({ data: validData })).rejects.toThrow(CONTACT_COPY.genericError)
  })

  it('rejects a failed bot check without sending', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: false })
    await expect(submitContactFormHandler({ data: validData })).rejects.toThrow(CONTACT_COPY.botCheckFailed)
    expect(sendContactFormEmail).not.toHaveBeenCalled()
  })

  it('rejects invalid fields before the bot check', async () => {
    await expect(submitContactFormHandler({ data: { ...validData, message: 'hi' } })).rejects.toThrow(
      CONTACT_COPY.messageRequired,
    )
    await expect(submitContactFormHandler({ data: { ...validData, email: 'not-an-email' } })).rejects.toThrow(
      CONTACT_COPY.emailRequired,
    )
    expect(verifyTurnstileToken).not.toHaveBeenCalled()
  })

  it('silently drops honeypot submissions', async () => {
    const result = await submitContactFormHandler({ data: { ...validData, [CONTACT_HONEYPOT_FIELD]: 'bot' } })
    expect(result).toEqual({ success: true })
    expect(sendContactFormEmail).not.toHaveBeenCalled()
  })

  it('rate limits repeat messages from one email', async () => {
    for (let i = 0; i < CONTACT_EMAIL_LIMIT; i++) {
      await submitContactFormHandler({ data: validData })
    }
    await expect(submitContactFormHandler({ data: validData })).rejects.toThrow(CONTACT_COPY.rateLimited)
  })

  it('records a new opted-in lead without marking the guide as claimed', async () => {
    const values = mockLeadLookup([])
    await submitContactFormHandler({ data: { ...validData, emailOptIn: true } })
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'crab@example.com', source: 'org_contact', claimedPdf: false, emailOptIn: true }),
    )
  })

  it('still succeeds when recording the opt-in fails', async () => {
    dbMock.select.mockImplementation(() => {
      throw new Error('db down')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(submitContactFormHandler({ data: { ...validData, emailOptIn: true } })).resolves.toEqual({
      success: true,
    })
    warn.mockRestore()
  })
})
