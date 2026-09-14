import { afterEach, describe, expect, it, vi } from 'vitest'
import { SUPPORT_INBOX } from '../support-tickets'
import {
  EMAIL_VERIFICATION_EMBLEM_URL,
  EMAIL_VERIFICATION_MAIL,
} from '../../emails/email-verification'
import {
  DEFAULT_SUPPORT_FROM,
  RESEND_EMAILS_URL,
  renderEmailVerificationHtml,
  renderEmailVerificationText,
  renderSupportTicketEmailText,
  sendEmailVerificationEmail,
  sendSupportTicketEmail,
} from './mail'

describe('support ticket mail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('renders staff text with ticket id, member identity, subject, and body', () => {
    const text = renderSupportTicketEmailText({
      ticketId: 'ticket-1',
      memberId: 'member-9',
      handle: 'claw_lord',
      memberEmail: 'claw@moltology.org',
      subject: 'Chassis freeze',
      body: 'The vault would not open.',
      category: 'ACCOUNT',
      urgency: 'HIGH',
    })

    expect(text).toContain('Ticket: ticket-1')
    expect(text).toContain('Member id: member-9')
    expect(text).toContain('Handle: claw_lord')
    expect(text).toContain('Member email: claw@moltology.org')
    expect(text).toContain('Topic: Account & sign-in')
    expect(text).toContain('Priority: High')
    expect(text).toContain('Subject: Chassis freeze')
    expect(text).toContain('The vault would not open.')
    expect(text).not.toMatch(/SHELL_INTEGRITY|Critical breach|Benthic|Dispatch|Transmit/)
  })

  it('renders legacy CRITICAL as Urgent and unknown topics as Something else', () => {
    const text = renderSupportTicketEmailText({
      ticketId: 'ticket-2',
      memberId: 'member-9',
      handle: 'claw_lord',
      subject: 'Cannot sign in',
      body: 'The sign-in page stays blank.',
      category: 'SESSION_CLEARANCE',
      urgency: 'CRITICAL',
    })

    expect(text).toContain('Topic: Something else')
    expect(text).toContain('Priority: Urgent')
    expect(text).not.toContain('CRITICAL')
    expect(text).not.toContain('SESSION_CLEARANCE')
  })

  it('skips sending when no Resend key is configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendSupportTicketEmail({
      ticketId: 'ticket-1',
      memberId: 'member-9',
      handle: 'claw_lord',
      subject: 'Chassis freeze',
      body: 'The vault would not open.',
      category: 'ACCOUNT',
      urgency: 'HIGH',
    })

    expect(result).toEqual({ sent: false, skipped: true, error: 'missing-api-key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts only to support@moltology.org and ignores a form-chosen recipient', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('RESEND_FROM_EMAIL', DEFAULT_SUPPORT_FROM)
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '',
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendSupportTicketEmail({
      ticketId: 'ticket-1',
      memberId: 'member-9',
      handle: 'claw_lord',
      memberEmail: 'claw@moltology.org',
      subject: 'Chassis freeze',
      body: 'The vault would not open.',
      category: 'ACCOUNT',
      urgency: 'HIGH',
      to: 'attacker@evil.test',
      recipient: 'other@evil.test',
    })

    expect(result).toEqual({ sent: true })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(RESEND_EMAILS_URL)
    const payload = JSON.parse((init as { body: string }).body)
    expect(payload.to).toEqual([SUPPORT_INBOX])
    expect(payload.to).not.toContain('attacker@evil.test')
    expect(payload.reply_to).toBe('claw@moltology.org')
    expect(payload.from).toBe(DEFAULT_SUPPORT_FROM)
    expect(payload.subject).toBe('[Ticket ticket-1] Chassis freeze')
    expect(payload.text).toContain('Member id: member-9')
  })
})

describe('email verification mail', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('renders confirmation text with the verify url and no stack names', () => {
    const text = renderEmailVerificationText({
      to: 'member@example.com',
      url: 'https://moltology.org/api/auth/verify-email?token=abc',
    })
    expect(text).toContain(EMAIL_VERIFICATION_MAIL.heading)
    expect(text).toContain(EMAIL_VERIFICATION_MAIL.body)
    expect(text).toContain(EMAIL_VERIFICATION_MAIL.ignore)
    expect(text).toContain('https://moltology.org/api/auth/verify-email?token=abc')
    expect(text).not.toMatch(/Resend|React Email|Better Auth|\bJWT\b/)
  })

  it('renders React Email HTML with the confirm button and emblem', async () => {
    const url = 'https://moltology.org/api/auth/verify-email?token=abc&next=/home'
    const html = await renderEmailVerificationHtml({
      to: 'member@example.com',
      url,
    })
    expect(html).toContain(EMAIL_VERIFICATION_MAIL.heading)
    expect(html).toContain(EMAIL_VERIFICATION_MAIL.button)
    expect(html).toContain(EMAIL_VERIFICATION_EMBLEM_URL)
    expect(html).toContain('href="https://moltology.org/api/auth/verify-email?token=abc&amp;next=/home"')
    expect(html).toContain('#00c3ff')
    expect(html).not.toMatch(/Resend|React Email|Better Auth|\bJWT\b/)
  })

  it('posts verification mail to the member address', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
    vi.stubEnv('RESEND_FROM_EMAIL', DEFAULT_SUPPORT_FROM)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => '' })
    vi.stubGlobal('fetch', fetchMock)

    const result = await sendEmailVerificationEmail({
      to: 'member@example.com',
      url: 'https://moltology.org/api/auth/verify-email?token=abc',
    })

    expect(result).toEqual({ sent: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(RESEND_EMAILS_URL)
    const payload = JSON.parse((init as { body: string }).body)
    expect(payload.to).toEqual(['member@example.com'])
    expect(payload.subject).toBe(EMAIL_VERIFICATION_MAIL.subject)
    expect(payload.text).toContain('token=abc')
    expect(payload.html).toContain('token=abc')
    expect(payload.html).toContain(EMAIL_VERIFICATION_MAIL.button)
    expect(payload.html).toContain(EMAIL_VERIFICATION_EMBLEM_URL)
  })

  it('skips verification mail when Resend key is missing', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const result = await sendEmailVerificationEmail({
      to: 'member@example.com',
      url: 'https://moltology.org/api/auth/verify-email?token=abc',
    })
    expect(result).toEqual({ sent: false, skipped: true, error: 'missing-api-key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
