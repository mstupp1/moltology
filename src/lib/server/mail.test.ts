import { afterEach, describe, expect, it, vi } from 'vitest'
import { SUPPORT_INBOX } from '../support-tickets'
import {
  DEFAULT_SUPPORT_FROM,
  RESEND_EMAILS_URL,
  renderSupportTicketEmailText,
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
      category: 'SHELL_INTEGRITY',
      urgency: 'HIGH',
    })

    expect(text).toContain('Ticket: ticket-1')
    expect(text).toContain('Member id: member-9')
    expect(text).toContain('Handle: claw_lord')
    expect(text).toContain('Member email: claw@moltology.org')
    expect(text).toContain('Subject: Chassis freeze')
    expect(text).toContain('The vault would not open.')
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
      category: 'SHELL_INTEGRITY',
      urgency: 'HIGH',
    })

    expect(result).toEqual({ sent: false, skipped: true, error: 'missing-api-key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts only to support@moltology.org and ignores a form-chosen recipient', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_key')
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
      category: 'SHELL_INTEGRITY',
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
