import { describe, expect, it } from 'vitest'
import { buildFieldManualHtml, PAGE_COUNT, type FieldManualAssets, type FieldManualImageKey } from './template'
import { CONTENTS } from './content'

const KEYS: FieldManualImageKey[] = [
  'coverCrab', 'carapace', 'chamber', 'pincer', 'seafloor', 'city',
  'phoneMoltmax', 'phoneDashboard', 'phoneOracle', 'phoneForum',
]

function assets(): FieldManualAssets {
  return {
    images: Object.fromEntries(KEYS.map((k) => [k, `data:image/jpeg;base64,${k}`])) as Record<FieldManualImageKey, string>,
    emblemSvg: '<svg id="emblem"></svg>',
    lockupSvg: '<svg id="lockup"></svg>',
    qrSvg: '<svg id="qr"></svg>',
    signupUrl: 'https://moltology.org/sign-up?utm_source=field-manual',
    auditUrl: 'https://moltology.org/moltmax?utm_source=field-manual',
  }
}

describe('field manual template', () => {
  const html = buildFieldManualHtml(assets())

  it('renders every page once, in order', () => {
    const pages = [...html.matchAll(/<section[^>]*data-page="(\d+)"/g)].map((m) => Number(m[1]))
    expect(pages).toEqual(Array.from({ length: PAGE_COUNT }, (_, i) => i + 1))
  })

  it('uses every image and links to sign-up', () => {
    for (const k of KEYS) expect(html).toContain(`base64,${k}`)
    expect(html).toContain('id="qr"')
    expect(html).toContain('href="https://moltology.org/sign-up?utm_source=field-manual"')
  })

  it('keeps the contents page numbers in range', () => {
    for (const c of CONTENTS) {
      expect(c.page).toBeGreaterThan(1)
      expect(c.page).toBeLessThan(PAGE_COUNT)
      expect(html).toContain(`data-page="${c.page}"`)
    }
  })

  it('stays clear of banned copy patterns', () => {
    const text = html.replace(/<style>[\s\S]*?<\/style>/, '')
    expect(text).not.toContain('◈')
    expect(text).not.toMatch(/earned only|can never be bought/i)
    expect(text).not.toMatch(/\s\/\/\s/)
  })
})

describe('site copy', () => {
  it('advertises the real page count', async () => {
    const { GUIDE_PDF_PAGES } = await import('../../../src/lib/guide-pdf')
    expect(GUIDE_PDF_PAGES).toBe(PAGE_COUNT)
  })
})
