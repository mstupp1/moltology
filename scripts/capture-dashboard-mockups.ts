import 'dotenv/config'
import { spawn, execSync, execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import https from 'node:https'
import os from 'node:os'
import { chromium, type Page } from 'playwright-core'
import { resolveChromeExecutable } from './lib/composite-renderer'
import { REGISTERED_TARGETS, DEFAULT_CAPTURE_TARGETS, type CaptureTarget } from './lib/mockup-targets'
import { advanceServiceWorkerVersion } from './lib/mockup-cache-version'
import { validateDevCapture } from './lib/mockup-dev-auth'
import { installShowcase, showcaseNow } from './lib/mockup-showcase'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { needsEmailRefresh } from './build-email-feature-images.mjs'

const PORT = 3019
const BASE_URL = `http://127.0.0.1:${PORT}`
const OUTPUT_DIR = path.resolve('public/images/marketing')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function waitForServer(url: string, timeoutMs = 25000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = () => {
      // --base-url may point at a deployed https site as well as a local server.
      const req = (url.startsWith('https:') ? https : http).get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) {
          resolve()
        } else {
          retry()
        }
      })
      req.setTimeout(3000, () => req.destroy())
      req.on('error', () => retry())
    }

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`))
      } else {
        setTimeout(check, 350)
      }
    }

    check()
  })
}

async function encodeMarketingWebp(
  inputPng: string,
  outputWebp: string,
  quality: number,
  maxWidth?: number,
) {
  console.log(`🗜️ Encoding ${path.basename(outputWebp)} (q=${quality}${maxWidth ? `, w=${maxWidth}` : ''})...`)
  const img = await loadImage(inputPng)
  let width = img.width
  let height = img.height
  if (maxWidth && width > maxWidth) {
    const ratio = maxWidth / width
    width = Math.round(maxWidth)
    height = Math.round(height * ratio)
  }
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, width, height)
  const buffer = await canvas.encode('webp', quality)
  fs.writeFileSync(outputWebp, buffer)
}

function bumpMarketingAssetVersion(): { newAssetVersion: number; newSwVersion: number } {
  // 1. Bump MARKETING_ASSET_VERSION
  const versionFile = path.resolve('src/lib/marketing-assets-version.ts')
  let currentVersion = 1
  if (fs.existsSync(versionFile)) {
    const content = fs.readFileSync(versionFile, 'utf8')
    const match = content.match(/MARKETING_ASSET_VERSION = '(\d+)'/)
    if (match) {
      currentVersion = parseInt(match[1], 10)
    }
  }
  const nextVersion = currentVersion + 1
  const versionContent = `/**
 * Auto-generated marketing assets version token.
 * Automatically incremented by scripts/capture-dashboard-mockups.ts to bust
 * browser, CDN, and Service Worker caches when new mockups are captured.
 */
export const MARKETING_ASSET_VERSION = '${nextVersion}'
`
  fs.writeFileSync(versionFile, versionContent, 'utf8')
  console.log(`🏷️ Bumped MARKETING_ASSET_VERSION to v${nextVersion} (in src/lib/marketing-assets-version.ts)`)

  // 2. Bump Service Worker cache VERSION in public/sw.js
  let nextSwVer = 2
  const swFile = path.resolve('public/sw.js')
  if (fs.existsSync(swFile)) {
    const refreshed = advanceServiceWorkerVersion(fs.readFileSync(swFile, 'utf8'))
    nextSwVer = refreshed.version
    fs.writeFileSync(swFile, refreshed.content, 'utf8')
    console.log(`Advanced service worker cache to v${nextSwVer}, preserving its brand suffix.`)
  }

  return { newAssetVersion: nextVersion, newSwVersion: nextSwVer }
}

async function main() {
  const args = process.argv.slice(2)
  const targetFilter = args.find((a) => a.startsWith('--target='))?.slice('--target='.length)
  const customUrl = args.find((a) => a.startsWith('--url='))?.slice('--url='.length)
  const customOutput = args.find((a) => a.startsWith('--output='))?.slice('--output='.length)

  const baseUrl = args.find((arg) => arg.startsWith('--base-url='))?.slice('--base-url='.length) || BASE_URL
  const authDev = args.includes('--auth-dev')
  if (authDev && !args.some((arg) => arg.startsWith('--base-url='))) throw new Error('--auth-dev requires an explicit --base-url for a running development server.')
  const credentials = authDev ? validateDevCapture(baseUrl, process.env) : null
  const mediaOrigin = args.find((arg) => arg.startsWith('--media-origin='))?.slice('--media-origin='.length)
  const offlineExternal = args.includes('--offline-external')
  const mediaCache = new Map<string, { body: Buffer; contentType: string }>()
  const executablePath = process.env.MOCKUP_CHROME_PATH || resolveChromeExecutable()
  if (!executablePath) throw new Error('Install Chrome/Chromium or set MOCKUP_CHROME_PATH.')

  console.log('📸 Starting automated marketing mockups & UI capture pipeline...')

  // Determine active targets
  let activeTargets: CaptureTarget[] = []

  if (Boolean(customUrl) !== Boolean(customOutput)) throw new Error('--url and --output must be supplied together.')
  if (customOutput && !/^[a-z0-9_-]+$/i.test(customOutput)) throw new Error('--output must be a simple filename without an extension.')
  if (customUrl && customOutput) {
    activeTargets = [
      {
        name: customOutput,
        route: customUrl,
        windowSize: '1760,1100',
        scaleFactor: 2,
        outputBase: customOutput,
      },
    ]
  } else if (targetFilter) {
    const keys = Object.keys(REGISTERED_TARGETS).filter((k) =>
      targetFilter === 'device' ? DEFAULT_CAPTURE_TARGETS.some((target) => target.name === k) && /_(desktop|mobile)$/.test(k) : k.toLowerCase().includes(targetFilter.toLowerCase())
    )
    if (keys.length === 0) {
      console.error(`❌ Unknown target: "${targetFilter}". Available targets: ${Object.keys(REGISTERED_TARGETS).join(', ')}`)
      process.exit(1)
    }
    activeTargets = keys.map((k) => REGISTERED_TARGETS[k])
  } else {
    activeTargets = DEFAULT_CAPTURE_TARGETS
  }

  // One pinned moment for the whole batch, so dates, "Next" task and relative times match across shots.
  const now = showcaseNow()

  // --base-url reuses a running local server; default remains an isolated production build.
  let serverProcess: ReturnType<typeof spawn> | undefined
  if (baseUrl === BASE_URL && !args.some((arg) => arg.startsWith('--base-url='))) {
    execSync('npm run build', {
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=8192' },
    })
    serverProcess = spawn('node', ['.output/server/index.mjs'], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: ['ignore', 'ignore', 'inherit'],
    })
  }
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'moltology-mockups-'))
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
  try {
    await waitForServer(`${baseUrl}/dashboard?preview=true`, 60000)
    browser = await chromium.launch({ executablePath, headless: true, args: ['--hide-scrollbars'] })
    for (const target of activeTargets) {
      const [width, height] = target.windowSize.split(',').map(Number)
      const context = await browser.newContext({
        viewport: { width, height }, deviceScaleFactor: target.scaleFactor,
        isMobile: Boolean(target.isMobile), hasTouch: Boolean(target.isMobile),
        reducedMotion: 'reduce', serviceWorkers: 'block',
      })
      try {
        await context.clock.setFixedTime(now)
        // Start with the member sidebar collapsed to its icon rail, so the page itself fills the shot.
        await context.addInitScript(() => localStorage.setItem('moltology_hud_sidebar_collapsed', 'true'))
        // The synthetic preview session has no JWT, so member reads come back empty. Stage the
        // showcase member instead; a real --auth-dev login shows that account's own data.
        if (!credentials) await installShowcase(context, now)
        const page = await context.newPage()
        if (credentials) {
          await context.addInitScript((id) => localStorage.setItem(`moltology:welcomed:${id}`, '1'), credentials.userId)
          await page.goto(new URL('/login', baseUrl).href, { waitUntil: 'domcontentloaded' })
          await page.getByLabel('Email Address', { exact: true }).fill(credentials.email)
          await page.getByLabel('Password', { exact: true }).fill(credentials.password)
          const signIn = page.waitForResponse((response) => response.url().includes('/api/auth/sign-in/email'))
          await page.locator('form button[type="submit"]').click()
          const response = await signIn
          if (!response.ok() || (await response.json()).user?.id !== credentials.userId) throw new Error('Development sign-in failed or returned the wrong account.')
        }
        // Restricted environments can't reach third-party image hosts (old seed avatars). Failing
        // those fast lets components show their own fallback instead of a broken image.
        if (offlineExternal) await page.route(
          (url) => url.origin !== new URL(baseUrl).origin && (!mediaOrigin || !url.href.startsWith(mediaOrigin)),
          (route) => (route.request().resourceType() === 'image' ? route.abort('blockedbyclient') : route.fallback()),
        )
        // Capture-only source override for environments without access to the production CDN.
        if (mediaOrigin) await page.route('**/media/**', async (route) => {
          const key = new URL(route.request().url()).pathname.slice('/media/'.length)
          let asset = mediaCache.get(key)
          if (!asset) {
            const response = await fetch(`${mediaOrigin.replace(/\/$/, '')}/${key}`, { signal: AbortSignal.timeout(15000) })
            if (!response.ok) { await route.fulfill({ status: response.status, body: '' }); return }
            asset = { body: Buffer.from(await response.arrayBuffer()), contentType: response.headers.get('content-type') || 'application/octet-stream' }
            mediaCache.set(key, asset)
          }
          await route.fulfill({ status: 200, ...asset })
        })
        const captureUrl = new URL(target.route, baseUrl)
        captureUrl.searchParams.set('preview', 'true')
        console.log(`Capturing ${target.name} (${width}x${height} @ ${target.scaleFactor}x)`)
        const response = await page.goto(captureUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 60000 })
        if (!response?.ok()) throw new Error(`Capture route failed: ${captureUrl.pathname}`)
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined)
        if (target.name.startsWith('oracle')) await stageOracleConversation(page, target.isMobile ? 1 : ORACLE_SAMPLES.length, now)
        if (target.name.startsWith('moltmax')) {
          await page.getByRole('button', { name: 'Start the quiz', exact: true }).last().click()
          await page.locator('[role=progressbar]').first().waitFor()
        }
        await page.evaluate(async () => {
          // Lazy images at the fold edge may never start in a still screenshot; load them now.
          document.querySelectorAll<HTMLImageElement>('img[loading="lazy"]').forEach((image) => { image.loading = 'eager' })
          await document.fonts.ready
          await Promise.all(Array.from(document.images).filter((image) => image.getBoundingClientRect().top < innerHeight)
            .map((image) => Promise.race([image.decode().catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 10000))])))
        })
        await page.waitForTimeout(1500)
        if (credentials) {
          // Do not publish the development account's display name in marketing images.
          const session = await context.request.get(new URL('/api/auth/get-session', baseUrl).href)
          const user = (await session.json())?.user
          if (user?.id !== credentials.userId) throw new Error('Development session did not persist.')
          await page.getByRole('button', { name: 'User account menu' }).evaluateAll((nodes) => nodes.forEach((node) => { (node as HTMLElement).style.visibility = 'hidden' }))
        }
        const brokenImages = await page.locator('img').evaluateAll((images) => images
          .filter((image) => {
            const rect = image.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 && (!image.complete || image.naturalWidth === 0)
          })
          .map((image) => image.currentSrc || image.src))
        if (brokenImages.length) throw new Error(`Unloaded visible images for ${target.name}: ${brokenImages.join(', ')}`)
        const text = await page.locator('body').innerText()
        if (text.trim().length < 30 || /Something went wrong|Internal Server Error|Cannot read properties|Cannot destructure|Could not load equipment|Could not load your character|Unauthenticated: Authentication required|Reading today’s liturgies…/.test(text)) {
          throw new Error(`Invalid or empty UI for ${target.name}; existing library preserved.`)
        }
        // Park the pointer on empty page edge; the top-left corner shows the collapsed rail's brand tooltip.
        await page.mouse.move(width - 2, Math.round(height / 2))
        await page.addStyleTag({ content: CAPTURE_CSS })
        const pngPath = path.join(stage, `${target.outputBase}.png`)
        await page.screenshot({ path: pngPath, animations: 'disabled', clip: target.clip ? await clipRegion(page, target.clip, width, height) : undefined })
        await encodeMarketingWebp(pngPath, path.join(stage, `${target.outputBase}.webp`), 90)
        await encodeMarketingWebp(pngPath, path.join(stage, `${target.outputBase}_sm.webp`), 86, target.isMobile ? 540 : 1280)
      } finally {
        if (credentials) await context.request.post(new URL('/api/auth/sign-out', baseUrl).href, { data: {}, headers: { origin: new URL(baseUrl).origin } }).catch(() => undefined)
        await context.close()
      }
    }
    // Publish only after the whole selected set succeeds, so pairs stay consistent.
    for (const filename of fs.readdirSync(stage).filter((name) => name.endsWith('.webp'))) {
      fs.copyFileSync(path.join(stage, filename), path.join(OUTPUT_DIR, filename))
    }
    // Automatically bump marketing asset version & Service Worker version to bust browser and CDN caches
    bumpMarketingAssetVersion()

    console.log(`Captured ${activeTargets.length} previews with full and responsive WebP variants.`)
  } finally {
    await browser?.close()
    serverProcess?.kill('SIGTERM')
    fs.rmSync(stage, { recursive: true, force: true })
  }

  // 3. Automated End-to-End Neon S3 CDN Sync
  const skipS3 = args.includes('--skip-s3') || args.includes('--no-s3')
  if (needsEmailRefresh(activeTargets)) {
    // The publisher verifies the public JPEG bytes before replacing email references.
    execFileSync(process.execPath, ['scripts/build-email-feature-images.mjs', ...(skipS3 ? [] : ['--publish'])], { stdio: 'inherit' })
  }
  if (!skipS3) {
    console.log('\n☁️ Automatically syncing marketing mockups to Neon S3 CDN...')
    execSync('npm run s3:sync', { stdio: 'inherit' })
    console.log('✅ Marketing mockups synced to Neon S3 with 100% asset parity!')
  } else {
    console.log('\n⏭️ Skipped S3 sync (--skip-s3 passed).')
  }
}

/** The padded element box, grown to the viewport's aspect ratio and kept inside the viewport. */
async function clipRegion(page: Page, clip: NonNullable<CaptureTarget['clip']>, width: number, height: number) {
  const box = await page.locator(clip.selector).first().evaluate((node, closest) => {
    const element = (closest ? node.closest(closest) : node) ?? node
    const rect = element.getBoundingClientRect()
    return { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
  }, clip.closest ?? null)
  let w = box.w + clip.pad * 2
  let h = box.h + clip.pad * 2
  if (w / h > width / height) h = w * (height / width)
  else w = h * (width / height)
  w = Math.min(w, width)
  h = Math.min(h, height)
  const x = Math.max(0, Math.min(width - w, box.x + box.w / 2 - w / 2))
  const y = Math.max(0, Math.min(height - h, box.y + box.h / 2 - h / 2))
  return { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) }
}

/**
 * Capture-only chrome: no scrollbars, no floating Oracle launcher (it covers the bottom-right of
 * desktop shots and the bottom of phone shots) and no chat "Jump to latest" button.
 */
const CAPTURE_CSS = [
  '* { scrollbar-width: none !important; } ::-webkit-scrollbar { display: none !important; }',
  '[aria-label="Open Oracle AI Popout"], [aria-label="Open Oracle AI Tray"], [aria-label="Jump to latest"] { visibility: hidden !important; }',
].join('\n')

/**
 * A guest Oracle opens on an empty chat, which reads as nothing on the homepage. Ask sample
 * questions and answer each from a fixed reply, so the capture shows a real exchange without
 * calling the model. Replies only suggest things a member can do; the Oracle has no tools.
 * Phones show the first exchange; the wide desktop column has room for the follow-up too.
 */
const ORACLE_SAMPLES = [
  {
    question: 'I have a report due Friday and I keep opening my inbox instead. Where do I start?',
    answer: [
      'Start smaller than feels respectable.',
      '',
      '1. **Close the inbox tab.** Not forever. Just until the first shed is done.',
      "2. **Write the report's worst first paragraph.** Twenty minutes, timer on, no editing.",
      '3. **Check messages once at 11:30**, then go back to the draft.',
      '',
      'Friday leaves room for three of these a day. Start the first one now.',
    ].join('\n'),
  },
  {
    question: 'Done. The paragraph is bad but it exists. What now?',
    answer: [
      'Good. A bad paragraph is a shell you can grow out of.',
      '',
      'Take five minutes away from the screen, then write the outline under it as plain headings. No sentences yet. When the outline is down, tick **Carapace Hardening** on today’s list and stop for lunch.',
    ].join('\n'),
  },
]

async function stageOracleConversation(page: Page, exchanges: number, now: Date) {
  await page.route('**/api/chat', (route) => {
    // Answer the latest sample question in the request; the chat resends earlier turns as history.
    const body = route.request().postData() ?? ''
    const sample = [...ORACLE_SAMPLES].reverse().find((item) => body.includes(JSON.stringify(item.question).slice(1, -1))) ?? ORACLE_SAMPLES[0]
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: sample.answer, threadId: null, isGuest: false }) })
  })
  const input = page.getByPlaceholder(/Ask/).first()
  await input.waitFor({ timeout: 15000 })
  for (const [index, sample] of ORACLE_SAMPLES.slice(0, exchanges).entries()) {
    // Messages are keyed by time, so each turn needs its own minute on the pinned clock.
    await page.clock.setFixedTime(new Date(now.getTime() + index * 60_000))
    await input.fill(sample.question)
    await input.press('Enter')
    await page.getByText(sample.answer.split('\n')[0]).first().waitFor({ timeout: 15000 })
  }
  // A short viewport scrolls to the latest reply; start the shot at the first question instead.
  await page.getByText(ORACLE_SAMPLES[0].question).first().evaluate((node) => node.scrollIntoView({ block: 'start' }))
}

main().catch((err) => {
  console.error('❌ Capture failed:', err)
  process.exit(1)
})
