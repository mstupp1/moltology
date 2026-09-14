import { describe, expect, it } from 'vitest'
import {
  EMAIL_VERIFICATION_EMBLEM_URL,
  EMAIL_VERIFICATION_MAIL,
  renderEmailVerificationEmailHtml,
} from './email-verification'

describe('email verification React template', () => {
  it('renders a confirm-email card with emblem, button, and no stack names', async () => {
    const url = 'https://moltology.org/api/auth/verify-email?token=abc&next=/dashboard'
    const html = await renderEmailVerificationEmailHtml(url)

    expect(html).toContain(EMAIL_VERIFICATION_MAIL.preview)
    expect(html).toContain(EMAIL_VERIFICATION_MAIL.heading)
    expect(html).toContain(EMAIL_VERIFICATION_MAIL.body)
    expect(html).toContain(EMAIL_VERIFICATION_MAIL.button)
    expect(html).toContain(EMAIL_VERIFICATION_MAIL.ignore)
    expect(html).toContain(EMAIL_VERIFICATION_EMBLEM_URL)
    expect(html).toContain('href="https://moltology.org/api/auth/verify-email?token=abc&amp;next=/dashboard"')
    expect(html).toContain('#070b0b')
    expect(html).toContain('#00c3ff')
    expect(html).not.toMatch(/Resend|React Email|Better Auth|\bJWT\b/)
    expect(html).not.toMatch(/Chitin Gems|Molt Credits/)
  })

  it('uses the public order emblem over HTTPS', () => {
    expect(EMAIL_VERIFICATION_EMBLEM_URL).toBe('https://moltology.org/images/order_emblem.png')
  })
})
