import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { resolveChromeExecutable } from './lib/composite-renderer'

// Uses a fresh guest context: no credentials, model calls, or database writes.
const baseUrl = new URL(process.argv[2] || 'http://localhost:3000')
assert(['localhost', '127.0.0.1', '[::1]'].includes(baseUrl.hostname), 'Use a local development server.')
const outputDir = path.resolve('tmp/verification/oracle')
await fs.mkdir(outputDir, { recursive: true })
const executablePath = resolveChromeExecutable()
assert(executablePath, 'Chrome/Chromium not found. Set COMPOSITE_CHROME_PATH to its executable.')
const browser = await chromium.launch({ executablePath, headless: true })

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900, isMobile: false, hasTouch: false },
    { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.isMobile,
      hasTouch: viewport.hasTouch,
    })
    try {
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      const response = await page.goto(new URL('/oracle', baseUrl).href, { waitUntil: 'networkidle' })
      assert(response?.ok(), `Oracle returned HTTP ${response?.status()}`)
      const input = page.getByRole('textbox', { name: 'Message', exact: true })
      await input.waitFor()
      await page.getByRole('button', { name: 'Switch to 3D Entity Mode', exact: true }).waitFor()
      assert.equal(await page.getByTestId('underwater-bubbles-canvas').count(), 0)
      await page.screenshot({ path: path.join(outputDir, `${viewport.name}-standard.png`) })

      await input.fill('A draft to preserve while switching views')
      await page.getByRole('button', { name: 'Switch to 3D Entity Mode', exact: true }).click()
      await page.getByTestId('synaptic-entity-hud').waitFor()
      assert.equal(await input.inputValue(), 'A draft to preserve while switching views')
      // A floating composer must not inherit a painted background from its wrappers.
      const floating = await input.evaluate((element) => {
        const card = element.parentElement?.parentElement
        if (!card) return false
        let wrapper = card.parentElement
        while (wrapper && !wrapper.hasAttribute('data-testid')) {
          const style = getComputedStyle(wrapper)
          if (style.backgroundImage !== 'none' || !['rgba(0, 0, 0, 0)', 'transparent'].includes(style.backgroundColor)) return false
          wrapper = wrapper.parentElement
        }
        return true
      })
      assert(floating, 'Composer has a painted wrapper')
      await input.blur()
      await page.screenshot({ path: path.join(outputDir, `${viewport.name}-entity.png`) })
      await page.reload({ waitUntil: 'networkidle' })
      await page.getByTestId('synaptic-entity-hud').waitFor()
      await page.getByRole('button', { name: 'Switch to standard chat', exact: true }).click()
      await page.getByRole('button', { name: 'Switch to 3D Entity Mode', exact: true }).waitFor()
      assert.equal(await page.getByTestId('underwater-bubbles-canvas').count(), 0)
      assert.deepEqual(errors, [], 'Browser runtime errors')
      console.log(`${viewport.name}: standard/entity rendering, draft, saved preference, floating composer, and no bubbles passed`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log(`Screenshots: ${outputDir}`)
