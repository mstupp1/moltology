import { afterEach, describe, expect, it, vi } from 'vitest'
import * as welcome from '../../emails/welcome'
import { sendWelcomeEmail } from './mail'
import { SUPPORT_INBOX } from '../support-tickets'

describe('welcome mail sender', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('sends stable HTML/text payloads with per-user deduplication and support Reply-To', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.stubEnv('RESEND_FROM_EMAIL', 'Moltology <accounts@moltology.org>')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    const input = { userId: 'member-1', to: 'member@example.com' }
    await expect(sendWelcomeEmail(input)).resolves.toEqual({ sent: true })
    await sendWelcomeEmail(input)
    expect(fetchMock.mock.calls[0][1].body).toBe(fetchMock.mock.calls[1][1].body)
    expect(fetchMock.mock.calls[0][1].headers).toEqual(fetchMock.mock.calls[1][1].headers)
    const init = fetchMock.mock.calls[0][1]
    expect(init.headers['Idempotency-Key']).toBe('welcome-user/member-1')
    const payload = JSON.parse(init.body)
    expect(payload).toMatchObject({ from: 'Moltology <accounts@moltology.org>', to: [input.to],
      subject: welcome.WELCOME_MAIL.subject, reply_to: SUPPORT_INBOX })
    expect(payload.text).toBe(welcome.renderWelcomeEmailText())
    expect(payload.html).toContain(welcome.WELCOME_MAIL.heading)
    await sendWelcomeEmail({ userId: 'member-2', to: 'other@example.com' })
    expect(fetchMock.mock.calls[2][1].headers['Idempotency-Key']).toBe('welcome-user/member-2')
  })

  it('still sends plain text when HTML rendering fails', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    vi.spyOn(welcome, 'renderWelcomeEmailHtml').mockRejectedValue(new Error('render failure'))
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendWelcomeEmail({ userId: 'member-1', to: 'member@example.com' })).resolves.toEqual({ sent: true })
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload.html).toBeUndefined()
    expect(payload.text).toContain(welcome.WELCOME_MAIL.body)
    expect(payload.text).toContain('https://moltology.org/forum')
  })

  it('reports a provider failure after one attempt', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test')
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500, text: async () => 'unavailable' })
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendWelcomeEmail({ userId: 'member-1', to: 'member@example.com' })).resolves.toEqual({ sent: false, error: 'http-500' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('skips delivery when the API key is absent', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(sendWelcomeEmail({ userId: 'member-1', to: 'member@example.com' })).resolves.toMatchObject({ sent: false, skipped: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
