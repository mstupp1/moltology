import { describe, expect, it } from 'vitest'
import {
  SUPPORT_INBOX,
  SUPPORT_TICKET_BODY_MAX,
  SUPPORT_TICKET_COPY,
  formatSupportTicketReference,
  isSupportTicketHoneypotTriggered,
  parseSupportTicketCategory,
  parseSupportTicketUrgency,
  sanitizeSupportTicketText,
  validateSupportTicketFields,
} from './support-tickets'

describe('support ticket intake helpers', () => {
  it('keeps the inbox pinned to support@ and never a form-chosen recipient', () => {
    expect(SUPPORT_INBOX).toBe('support@moltology.org')
  })

  it('strips HTML, control characters, and surrounding space from ticket text', () => {
    expect(sanitizeSupportTicketText('  <b>Hello</b>\u0007 world  ')).toBe('Hello world')
    expect(sanitizeSupportTicketText('<script>alert(1)</script>plain')).toBe('alert(1)plain')
    expect(sanitizeSupportTicketText(null)).toBe('')
  })

  it('rejects empty or oversized fields with plain errors', () => {
    expect(validateSupportTicketFields({ subject: 'ab', body: 'long enough body' }).ok).toBe(false)
    expect(validateSupportTicketFields({ subject: 'Lag on chassis', body: 'short' }).ok).toBe(false)
    expect(
      validateSupportTicketFields({
        subject: 'Lag on chassis',
        body: 'x'.repeat(SUPPORT_TICKET_BODY_MAX + 1),
      }),
    ).toEqual({ ok: false, error: SUPPORT_TICKET_COPY.bodyTooLong })

    const ok = validateSupportTicketFields({
      subject: '<em>Lag</em> on chassis',
      body: 'The loadout panel froze after I swapped greaves.',
    })
    expect(ok).toEqual({
      ok: true,
      subject: 'Lag on chassis',
      body: 'The loadout panel froze after I swapped greaves.',
    })
  })

  it('falls unknown category and urgency back to safe defaults', () => {
    expect(parseSupportTicketCategory('NEON_AUTH')).toBe('OTHER')
    expect(parseSupportTicketCategory('SHELL_INTEGRITY')).toBe('SHELL_INTEGRITY')
    expect(parseSupportTicketUrgency('IMMEDIATE')).toBe('NORMAL')
    expect(parseSupportTicketUrgency('HIGH')).toBe('HIGH')
  })

  it('treats a filled honeypot as triggered and a blank one as clean', () => {
    expect(isSupportTicketHoneypotTriggered('http://spam.test')).toBe(true)
    expect(isSupportTicketHoneypotTriggered('   ')).toBe(false)
    expect(isSupportTicketHoneypotTriggered(undefined)).toBe(false)
  })

  it('uses the durable ticket id as the member-facing reference', () => {
    const id = '7c2f1a90-3d44-4c1a-9b11-0f8c2e6a1111'
    expect(formatSupportTicketReference(id)).toBe(id)
  })

  it('keeps HUD copy free of slash-pairs', () => {
    const corpus = Object.values(SUPPORT_TICKET_COPY)
      .map((value) => (typeof value === 'function' ? value('abc-123') : value))
      .join(' ')
    expect(corpus).not.toMatch(/\s\/\/\s/)
  })
})
