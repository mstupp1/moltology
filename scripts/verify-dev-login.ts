import 'dotenv/config'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'
import { resolveChromeExecutable } from './lib/composite-renderer'

const base = new URL(process.argv[2] || 'http://localhost:3000')
assert(['localhost', '127.0.0.1', '[::1]'].includes(base.hostname), 'Use a local development server.')
const email = process.env.DEV_TEST_EMAIL
const password = process.env.DEV_TEST_PASSWORD
assert(email && password, 'Set DEV_TEST_EMAIL and DEV_TEST_PASSWORD in the ignored development .env.')
const executablePath = resolveChromeExecutable()
assert(executablePath, 'Install Chrome/Chromium or set COMPOSITE_CHROME_PATH.')
const output = path.resolve('tmp/verification/login')
await fs.mkdir(output, { recursive: true })
const browser = await chromium.launch({ executablePath, headless: true })
try {
  for (const viewport of [{ name: 'desktop', width: 1440, height: 900 }, { name: 'mobile', width: 390, height: 844 }]) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.name === 'mobile', hasTouch: viewport.name === 'mobile',
    })
    try {
      const page = await context.newPage()
      const errors: string[] = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(new URL('/login', base).href, { waitUntil: 'domcontentloaded' })
      await page.getByLabel('Email Address', { exact: true }).waitFor()
      // Auth pages load a third-party challenge; networkidle is unreliable here.
      await page.waitForLoadState('networkidle', { timeout: 3000 }).catch(() => {})
      if (process.env.DEV_TEST_USER_ID) {
        await page.evaluate((id) => localStorage.setItem(`moltology:welcomed:${id}`, '1'), process.env.DEV_TEST_USER_ID)
      }
      await page.getByLabel('Email Address', { exact: true }).fill(email)
      await page.getByLabel('Password', { exact: true }).fill(password)
      const signIn = page.waitForResponse((response) => response.url().includes('/api/auth/sign-in/email'))
      await page.locator('form button[type="submit"]').click()
      const response = await signIn
      assert(response.ok(), `Sign-in returned HTTP ${response.status()}`)
      const signedInUser = (await response.json()).user
      assert(signedInUser?.id, 'Sign-in did not return a user')
      await page.goto(new URL('/oracle', base).href, { waitUntil: 'networkidle' })
      await page.getByRole('textbox', { name: 'Message', exact: true }).waitFor()
      const session = await context.request.get(new URL('/api/auth/get-session', base).href)
      assert.equal((await session.json())?.user?.id, signedInUser.id)
      assert.equal(await page.getByText('GUEST MODE', { exact: true }).count(), 0)
      await page.screenshot({ path: path.join(output, `${viewport.name}.png`) })
      await page.reload({ waitUntil: 'networkidle' })
      const persisted = await context.request.get(new URL('/api/auth/get-session', base).href)
      assert.equal((await persisted.json())?.user?.id, signedInUser.id)
      const out = await context.request.post(new URL('/api/auth/sign-out', base).href, { data: {}, headers: { origin: base.origin } })
      assert(out.ok(), 'Sign-out failed')
      assert.equal(await (await context.request.get(new URL('/api/auth/get-session', base).href)).json(), null)
      assert.deepEqual(errors, [], 'Browser runtime errors')
      console.log(`${viewport.name}: login, authenticated Oracle, reload persistence, and sign-out passed`)
    } finally {
      await context.close()
    }
  }
} finally {
  await browser.close()
}
console.log(`Screenshots: ${output}`)
