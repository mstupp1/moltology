import { describe, expect, it } from 'vitest'
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS } from '../lib/auth-config'
import {
  EMAIL_VERIFICATION_EMBLEM_URL,
  EMAIL_VERIFICATION_MAIL,
  renderEmailVerificationEmailHtml,
  renderEmailVerificationEmailText,
} from './email-verification'
import { EMAIL_THEME, TRANSACTIONAL_EMAIL_BRAND_URL, TRANSACTIONAL_EMAIL_FOOTER } from './components/transactional'

const url = 'https://moltology.org/api/auth/verify-email?token=abc&next=/dashboard'

describe('email verification React template', () => {
  it('renders a minimal dark email with accessible branding and the action above supporting details', async () => {
    const html = await renderEmailVerificationEmailHtml(url)
    const document = new DOMParser().parseFromString(html, 'text/html')
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelector('meta[name="color-scheme"]')?.getAttribute('content')).toBe('dark')
    expect(document.querySelectorAll('h1')).toHaveLength(1)
    expect(document.querySelector('h1')?.textContent).toBe(EMAIL_VERIFICATION_MAIL.heading)
    const logo = document.querySelector('img')!
    expect(logo.src).toBe(TRANSACTIONAL_EMAIL_BRAND_URL)
    expect(logo.alt).toBe('Moltology — The Synaptic Path')
    expect(logo.width).toBe(110)
    expect(logo.height).toBe(107)
    expect(logo.closest('a')?.href).toBe('https://moltology.org/')
    expect(html).toContain(`background-color:${EMAIL_THEME.background}`)
    expect(html).toContain(`background-color:${EMAIL_THEME.surface}`)
    const action = Array.from(document.querySelectorAll('a')).find((link) => link.textContent === EMAIL_VERIFICATION_MAIL.button)!
    expect(action.href).toBe(url)
    expect(action.style.backgroundColor).toBe('rgb(0, 195, 255)')
    expect(action.style.color).toBe('rgb(7, 11, 11)')
    expect(parseInt(action.style.paddingTop) + parseInt(action.style.paddingBottom) + parseInt(action.style.lineHeight)).toBeGreaterThanOrEqual(44)
    expect(html.indexOf(EMAIL_VERIFICATION_MAIL.button)).toBeLessThan(html.indexOf(EMAIL_VERIFICATION_MAIL.expiration))
    expect(html).not.toMatch(/Resend|React Email|Better Auth|\bJWT\b|Chitin Gems|Molt Credits|unsubscribe|Foundation/i)
    const paragraphs = Array.from(document.querySelectorAll('p')).map((paragraph) => paragraph.textContent)
    expect(paragraphs.filter((copy) => copy?.includes('Moltology\u00a0account'))).toHaveLength(2)
    expect(Buffer.byteLength(html)).toBeLessThan(100_000)
  })

  it('keeps HTML and plain text aligned on the action, expiry, safety note and footer', async () => {
    const html = await renderEmailVerificationEmailHtml(url)
    const document = new DOMParser().parseFromString(html, 'text/html')
    const text = renderEmailVerificationEmailText(url)
    for (const copy of [EMAIL_VERIFICATION_MAIL.heading, EMAIL_VERIFICATION_MAIL.body,
      EMAIL_VERIFICATION_MAIL.button, EMAIL_VERIFICATION_MAIL.expiration,
      EMAIL_VERIFICATION_MAIL.fallback, EMAIL_VERIFICATION_MAIL.ignore]) {
      expect(document.body.textContent).toContain(copy)
      expect(text).toContain(copy)
    }
    expect(EMAIL_VERIFICATION_EXPIRES_IN_SECONDS).toBe(3600)
    expect(EMAIL_VERIFICATION_MAIL.expiration).toBe('This link expires in 1 hour.')
    for (const destination of [TRANSACTIONAL_EMAIL_FOOTER.privacyUrl, TRANSACTIONAL_EMAIL_FOOTER.termsUrl]) {
      expect(document.querySelector(`a[href="${destination}"]`)).not.toBeNull()
      expect(text).toContain(destination)
    }
    expect(document.querySelector('a[href="mailto:support@moltology.org"]')).not.toBeNull()
    expect(text).toContain(TRANSACTIONAL_EMAIL_FOOTER.support)
    expect(text).toContain(url)
  })

  it('preserves and escapes the complete URL in both the button and copyable fallback', async () => {
    const specialUrl = `${url}&value="<test>"&long=${'a'.repeat(800)}`
    const html = await renderEmailVerificationEmailHtml(specialUrl)
    const document = new DOMParser().parseFromString(html, 'text/html')
    const links = Array.from(document.querySelectorAll('a')).filter((link) => link.getAttribute('href') === specialUrl)
    expect(links).toHaveLength(2)
    expect(links[1].textContent).toBe(specialUrl)
    expect(links[1].style.wordBreak).toBe('break-all')
    expect(document.querySelector('test')).toBeNull()
    expect(html).toContain('&amp;value=&quot;&lt;test&gt;&quot;')
    expect(renderEmailVerificationEmailText(specialUrl)).toContain(specialUrl)
  })

  it('serves the full PNG logo through the public CDN and preserves the legacy emblem export', () => {
    expect(TRANSACTIONAL_EMAIL_BRAND_URL).toMatch(/^https:\/\/moltology\.org\/media\/images\/email\/moltology-lockup-dark-[a-f0-9]{12}\.png$/)
    expect(EMAIL_VERIFICATION_EMBLEM_URL).toBe('https://moltology.org/images/order_emblem.png')
  })
})
