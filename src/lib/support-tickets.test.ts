import { describe, expect, it } from 'vitest'
import {
  SUPPORT_INBOX,
  SUPPORT_TICKET_BODY_MAX,
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_CATEGORY_LABELS,
  SUPPORT_PAGE_COPY,
  SUPPORT_TICKET_COPY,
  SUPPORT_TICKET_URGENCIES,
  SUPPORT_TICKET_URGENCY_LABELS,
  formatSupportTicketReference,
  isSupportTicketHoneypotTriggered,
  parseSupportTicketCategory,
  parseSupportTicketUrgency,
  sanitizeSupportTicketText,
  supportTicketCategoryLabel,
  supportTicketUrgencyLabel,
  supportTicketFallbackSubject,
  validateSupportTicketBody,
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

  it('caps the message at 1,200 characters so Laya can read all of it', () => {
    expect(SUPPORT_TICKET_BODY_MAX).toBe(1200)
    expect(validateSupportTicketBody('short')).toEqual({ ok: false, error: SUPPORT_TICKET_COPY.bodyRequired })
    expect(validateSupportTicketBody('x'.repeat(SUPPORT_TICKET_BODY_MAX + 1))).toEqual({
      ok: false,
      error: SUPPORT_TICKET_COPY.bodyTooLong,
    })
    expect(validateSupportTicketBody('<em>The</em> loadout panel froze after I swapped greaves.')).toEqual({
      ok: true,
      body: 'The loadout panel froze after I swapped greaves.',
    })
  })

  it('falls back to the first words of the message for a subject', () => {
    expect(supportTicketFallbackSubject('Cannot sign in\nIt says my code expired')).toBe('Cannot sign in')
    const long = supportTicketFallbackSubject(
      'I was charged twice for Oracle MAX this morning and the second charge has not been refunded yet',
    )
    expect(long.length).toBeLessThanOrEqual(63)
    expect(long.endsWith('...')).toBe(true)
    expect(supportTicketFallbackSubject('   ')).toBe('Support message')
  })

  it('falls unknown category and urgency back to safe defaults', () => {
    expect(parseSupportTicketCategory('NEON_AUTH')).toBe('OTHER')
    expect(parseSupportTicketCategory('SHELL_INTEGRITY')).toBe('OTHER')
    expect(parseSupportTicketCategory('ACCOUNT')).toBe('ACCOUNT')
    expect(parseSupportTicketCategory('billing')).toBe('BILLING')
    expect(parseSupportTicketUrgency('IMMEDIATE')).toBe('NORMAL')
    expect(parseSupportTicketUrgency('HIGH')).toBe('HIGH')
    expect(parseSupportTicketUrgency('URGENT')).toBe('URGENT')
    expect(parseSupportTicketUrgency('CRITICAL')).toBe('URGENT')
  })

  it('uses plain scalable topic and priority labels', () => {
    expect(SUPPORT_TICKET_CATEGORIES).toEqual(['ACCOUNT', 'BILLING', 'BUG', 'OTHER'])
    expect(SUPPORT_TICKET_URGENCIES).toEqual(['NORMAL', 'HIGH', 'URGENT'])
    expect(SUPPORT_TICKET_CATEGORY_LABELS).toEqual({
      ACCOUNT: 'Account & sign-in',
      BILLING: 'Billing & purchases',
      BUG: "Something's broken",
      OTHER: 'Something else',
    })
    expect(SUPPORT_TICKET_URGENCY_LABELS).toEqual({
      NORMAL: 'Normal',
      HIGH: 'High',
      URGENT: 'Urgent',
    })
    expect(supportTicketCategoryLabel('SHELL_INTEGRITY')).toBe('Something else')
    expect(supportTicketUrgencyLabel('CRITICAL')).toBe('Urgent')
  })

  it('keeps locked form copy in plain English', () => {
    expect(SUPPORT_TICKET_COPY.formTitle).toBe('Contact support')
    expect(SUPPORT_TICKET_COPY.formHint).toBe("We'll read every message and reply by email.")
    expect(SUPPORT_TICKET_COPY.bodyLabel).toBe("What's going on?")
    expect(SUPPORT_TICKET_COPY.counter(46, 1200)).toBe('46 / 1,200')
    expect(SUPPORT_TICKET_COPY.submit).toBe('Send')
    expect(SUPPORT_TICKET_COPY.submitting).toBe('Sending')
    expect(SUPPORT_TICKET_COPY.successBody('abc-123')).toBe(
      "We got your message. Reference abc-123. We'll email you when there's an update.",
    )
    expect(SUPPORT_TICKET_COPY.guestTitle).toBe('Contact support')
    expect(SUPPORT_PAGE_COPY.pageTitle).toBe('Support')
    expect(SUPPORT_PAGE_COPY.tabChangelog).toBe('Changelog')
    expect(SUPPORT_PAGE_COPY).not.toHaveProperty('tabFaq')
    expect(SUPPORT_PAGE_COPY.tabContact).toBe('Contact')
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
    const corpus = [...Object.values(SUPPORT_TICKET_COPY), ...Object.values(SUPPORT_PAGE_COPY)]
      .map((value) => (typeof value === 'function' ? (value as (...args: unknown[]) => string)('abc-123', 1200) : value))
      .join(' ')
    expect(corpus).not.toMatch(/\s\/\/\s/)
    expect(corpus).not.toMatch(
      /neural|telemetry|benthic|steward|carapace|chassis|\bpressure\b|critical breach|transmit|dispatch/i,
    )
  })
})
