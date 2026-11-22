#!/usr/bin/env node
/**
 * Browser QA for the benefit landing pages: opens each page at phone, tablet and desktop
 * widths, fails on layout problems, and writes screenshots plus one contact sheet of every
 * hero side by side so look-alike pages are easy to spot.
 *
 * Needs a running site: `npm run dev` (or a preview URL).
 * Run: npm run benefits:shots -- [--base http://localhost:5173] [--only libido,energy-drinks]
 * Output: output/benefit-shots/ (gitignored)
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { chromium, type Page } from 'playwright-core'
import sharp from 'sharp'
import { BENEFIT_PAGES } from '../src/lib/benefits/summaries'
import { resolveChromeExecutable } from './lib/composite-renderer'

const OUT_DIR = 'output/benefit-shots'
const WIDTHS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
] as const

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const base = (arg('base') ?? process.env.BENEFITS_BASE_URL ?? 'http://localhost:5173').replace(/\/+$/, '')
const only = arg('only')?.split(',').map((slug) => slug.trim())
const slugs = BENEFIT_PAGES.map((page) => page.slug).filter((slug) => !only || only.includes(slug))

interface Problem {
  slug: string
  viewport: string
  message: string
}

async function inspect(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const firstScreen = window.innerHeight
    const visible = (el: Element | null) => {
      if (!el) return false
      const rect = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }
    const heroAction = Array.from(document.querySelectorAll('main button, main a')).find((el) => {
      const rect = el.getBoundingClientRect()
      return visible(el) && rect.top < firstScreen && rect.bottom > 0
    })
    const overflowing = Array.from(document.querySelectorAll('main *'))
      .filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.right > doc.clientWidth + 1 && getComputedStyle(el).position !== 'fixed'
      })
      .filter((el) => !el.closest('.cn-marquee'))
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className?.toString() ?? '').split(' ')[0]}`)
    // Small text above the reveal must reach WCAG AA against its nearest solid background.
    // Text over images or gradients is skipped: check those by eye in the screenshots.
    const reveal = document.querySelector('.benefit-reveal')
    const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number)
    const lum = ([r, g, b]: number[]) => {
      const c = [r, g, b].map((v) => {
        const x = v / 255
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    }
    const lowContrast: string[] = []
    for (const el of Array.from(document.querySelectorAll('main p, main span, main a, main button, main li, main dt, main dd, main h1, main h2, main h3, main summary'))) {
      if (reveal?.contains(el) || !visible(el)) continue
      const own = Array.from(el.childNodes).some((node) => node.nodeType === 3 && node.textContent?.trim())
      if (!own) continue
      const style = getComputedStyle(el)
      if (style.webkitTextFillColor === 'transparent' || el.closest('[aria-hidden="true"]')) continue
      let bg: number[] | null = null
      let node: Element | null = el
      while (node) {
        const cs = getComputedStyle(node)
        if (cs.backgroundImage !== 'none') break
        const c = rgb(cs.backgroundColor)
        if (c.length >= 3 && (c[3] === undefined || c[3] === 1)) {
          bg = c
          break
        }
        node = node.parentElement
      }
      if (!bg) continue
      const fg = rgb(style.color)
      if (fg[3] !== undefined && fg[3] < 1) continue
      const [a, b] = [lum(fg), lum(bg)].sort((x, y) => y - x)
      const ratio = (a + 0.05) / (b + 0.05)
      const size = parseFloat(style.fontSize)
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
      if (ratio < (large ? 3 : 4.5)) {
        lowContrast.push(`${(el.textContent ?? '').trim().slice(0, 30)} (${ratio.toFixed(2)}:1)`)
      }
    }
    return {
      lowContrast: Array.from(new Set(lowContrast)).slice(0, 6),
      sideScroll: doc.scrollWidth - doc.clientWidth,
      overflowing,
      h1Count: document.querySelectorAll('h1').length,
      headerCta: visible(document.querySelector('.bh-cta')),
      heroAction: Boolean(heroAction),
      brokenImages: Array.from(document.images)
        .filter((img) => img.complete && img.naturalWidth === 0)
        .map((img) => img.getAttribute('src')),
      robots: document.querySelector('meta[name="robots"]')?.getAttribute('content') ?? '',
      jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    }
  })
}

async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo(0, y)
      await new Promise((resolve) => setTimeout(resolve, 120))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(400)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ executablePath: resolveChromeExecutable() ?? '/opt/pw-browsers/chromium' })
  const problems: Problem[] = []
  const heroShots: string[] = []

  try {
    for (const slug of slugs) {
      for (const viewport of WIDTHS) {
        const context = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
        })
        // tsx keeps function names with a __name helper that the page does not have.
        await context.addInitScript({ content: 'window.__name = (fn) => fn' })
        const page = await context.newPage()
        const consoleErrors: string[] = []
        page.on('pageerror', (error) => consoleErrors.push(error.message))
        const note = (message: string) => problems.push({ slug, viewport: viewport.name, message })

        if (viewport === WIDTHS[0]) {
          // Search engines read the server HTML, so the costume's H1 must be in it, not only after hydration.
          const html = await (await fetch(`${base}/benefits/${slug}`)).text()
          if (!/<h1[\s>]/.test(html)) note('No h1 in the server-rendered HTML')
        }
        const response = await page.goto(`${base}/benefits/${slug}`, { waitUntil: 'networkidle' })
        if (!response || response.status() >= 400) note(`HTTP ${response?.status() ?? 'no response'}`)
        await page.evaluate(() => document.fonts.ready)
        await page.waitForTimeout(300)

        const first = path.join(OUT_DIR, `${slug}-${viewport.name}-fold.png`)
        await page.screenshot({ path: first })
        if (viewport.name === 'desktop') heroShots.push(first)

        await scrollThrough(page)
        const result = await inspect(page)
        if (result.sideScroll > 1) note(`Scrolls sideways by ${result.sideScroll}px (${result.overflowing.join(', ')})`)
        if (result.h1Count !== 1) note(`${result.h1Count} h1 elements (want 1)`)
        if (!result.headerCta) note('Header sign-up button is not visible')
        if (!result.heroAction) note('No button or link in the first screen')
        if (result.brokenImages.length) note(`Broken images: ${result.brokenImages.join(', ')}`)
        if (!result.jsonLd) note('No JSON-LD on the page')
        if (result.lowContrast.length) note(`Low contrast text: ${result.lowContrast.join('; ')}`)
        for (const error of consoleErrors) note(`Page error: ${error}`)

        await page.screenshot({ path: path.join(OUT_DIR, `${slug}-${viewport.name}-full.png`), fullPage: true })
        await context.close()
      }
    }
  } finally {
    await browser.close()
  }

  if (heroShots.length) {
    const tileWidth = 720
    const tileHeight = 450
    const columns = Math.min(3, heroShots.length)
    const rows = Math.ceil(heroShots.length / columns)
    const tiles = await Promise.all(
      heroShots.map((file) => sharp(file).resize(tileWidth, tileHeight, { fit: 'cover', position: 'top' }).toBuffer()),
    )
    await sharp({
      create: { width: columns * tileWidth, height: rows * tileHeight, channels: 3, background: '#030708' },
    })
      .composite(tiles.map((input, index) => ({ input, left: (index % columns) * tileWidth, top: Math.floor(index / columns) * tileHeight })))
      .jpeg({ quality: 82 })
      .toFile(path.join(OUT_DIR, 'contact-sheet.jpg'))
  }

  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), `${JSON.stringify({ base, slugs, problems }, null, 2)}\n`)
  for (const problem of problems) console.error(`  ✗ ${problem.slug} @ ${problem.viewport}: ${problem.message}`)
  if (problems.length) {
    console.error(`[benefits:shots] ${problems.length} problem(s). Screenshots in ${OUT_DIR}/`)
    process.exit(1)
  }
  console.log(`[benefits:shots] OK: ${slugs.length} pages x ${WIDTHS.length} widths. Contact sheet: ${OUT_DIR}/contact-sheet.jpg`)
}

await main()
