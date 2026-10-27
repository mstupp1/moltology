import { describe, expect, it } from 'vitest'
import { WELCOME_MAIL, renderWelcomeEmailHtml, renderWelcomeEmailText } from './welcome'
import { TRANSACTIONAL_EMAIL_BRAND_URL, TRANSACTIONAL_EMAIL_FOOTER } from './components/transactional'

describe('welcome email', () => {
  it('introduces the three starting points with one primary button and the approved small logo', async () => {
    const html = await renderWelcomeEmailHtml()
    const document = new DOMParser().parseFromString(html, 'text/html')
    expect(document.documentElement.lang).toBe('en')
    expect(document.querySelectorAll('h1')).toHaveLength(1)
    expect(document.querySelector('h1')?.textContent).toBe(WELCOME_MAIL.heading)
    expect(document.querySelector('img')?.src).toBe(TRANSACTIONAL_EMAIL_BRAND_URL)
    expect(document.querySelector('img')?.width).toBe(110)
    expect(document.querySelector('img')?.alt).toBe('Moltology — The Synaptic Path')
    const steps = Array.from(document.querySelectorAll('ol > li'))
    expect(steps).toHaveLength(3)
    expect(steps.map((step) => step.querySelector('a')?.href)).toEqual([
      'https://moltology.org/dashboard', 'https://moltology.org/oracle', 'https://moltology.org/forum',
    ])
    expect(document.querySelectorAll('h2')).toHaveLength(3)
    expect(document.querySelectorAll('img')).toHaveLength(4)
    steps.forEach((step, index) => {
      const image = step.querySelector('img')!
      expect(image.src).toBe(WELCOME_MAIL.steps[index].imageUrl)
      expect(image.src).toMatch(/^https:\/\/moltology\.org\/media\/images\/email\/welcome-[a-z]+-[a-f0-9]{12}\.jpg\?v=[a-f0-9]{12}$/)
      expect(image.alt).toBe(WELCOME_MAIL.steps[index].imageAlt)
      expect(image.closest('a')?.href).toBe(WELCOME_MAIL.steps[index].url)
      expect(step.querySelector('h2')?.textContent).toContain(WELCOME_MAIL.steps[index].title)
    })
    const buttons = Array.from(document.querySelectorAll('a')).filter((link) => link.textContent === WELCOME_MAIL.button)
    expect(buttons).toHaveLength(1)
    expect(buttons[0].href).toBe('https://moltology.org/dashboard')
    expect(buttons[0].style.backgroundColor).toBe('rgb(0, 195, 255)')
    expect(document.body.textContent).toContain('Thanks for joining\u00a0Moltology.')
    expect(document.body.textContent).toContain('below\u00a0the\u00a0surface.')
    expect(document.body.textContent).not.toContain('account is ready')
    expect(WELCOME_MAIL.body).toContain('first\u00a0step.')
    for (const step of WELCOME_MAIL.steps) {
      expect(step.title).toContain('\u00a0')
      expect(step.body).toContain('\u00a0')
    }
    expect(html).toContain('background-color:#070b0b')
    expect(html).not.toMatch(/unsubscribe|Premium|Molt Credits|React Email|Resend|Better Auth|<svg/i)
    expect(Buffer.byteLength(html)).toBeLessThan(100_000)
  })

  it('keeps welcome copy, feature links and footer available in HTML and plain text', async () => {
    const html = await renderWelcomeEmailHtml()
    const document = new DOMParser().parseFromString(html, 'text/html')
    const text = renderWelcomeEmailText()
    for (const copy of [WELCOME_MAIL.heading, WELCOME_MAIL.body,
      ...WELCOME_MAIL.steps.flatMap((step) => [step.title, step.body])]) {
      expect(document.body.textContent).toContain(copy)
      expect(text).toContain(copy)
    }
    expect(html).toContain(WELCOME_MAIL.preview)
    for (const url of [...WELCOME_MAIL.steps.map((step) => step.url),
      TRANSACTIONAL_EMAIL_FOOTER.privacyUrl, TRANSACTIONAL_EMAIL_FOOTER.termsUrl]) {
      expect(document.querySelector(`a[href="${url}"]`)).not.toBeNull()
      expect(text).toContain(url)
    }
    expect(document.querySelector('a[href="mailto:support@moltology.org"]')).not.toBeNull()
    expect(text).toContain(TRANSACTIONAL_EMAIL_FOOTER.support)
  })
})
