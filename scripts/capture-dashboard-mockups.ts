import 'dotenv/config'
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import os from 'node:os'
import { chromium } from 'playwright-core'
import { resolveChromeExecutable } from './lib/composite-renderer'
import { REGISTERED_TARGETS, DEFAULT_CAPTURE_TARGETS, type CaptureTarget } from './lib/mockup-targets'
import { advanceServiceWorkerVersion } from './lib/mockup-cache-version'
import { createCanvas, loadImage } from '@napi-rs/canvas'

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
      const req = http.get(url, (res) => {
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
  const mediaOrigin = args.find((arg) => arg.startsWith('--media-origin='))?.slice('--media-origin='.length)
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
        const page = await context.newPage()
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
        if (target.name.startsWith('moltmax')) {
          await page.getByRole('button', { name: 'Start the quiz', exact: true }).last().click()
          await page.locator('[role=progressbar]').first().waitFor()
        }
        await page.evaluate(async () => {
          await document.fonts.ready
          await Promise.all(Array.from(document.images).filter((image) => image.getBoundingClientRect().top < innerHeight)
            .map((image) => Promise.race([image.decode().catch(() => undefined), new Promise((resolve) => setTimeout(resolve, 10000))])))
        })
        await page.waitForTimeout(1500)
        const text = await page.locator('body').innerText()
        if (text.trim().length < 30 || /Something went wrong|Internal Server Error|Cannot read properties|Cannot destructure|Could not load equipment/.test(text)) {
          throw new Error(`Invalid or empty UI for ${target.name}; existing library preserved.`)
        }
        await page.mouse.move(0, 0)
        await page.addStyleTag({ content: '* { scrollbar-width: none !important; } ::-webkit-scrollbar { display: none !important; }' })
        const pngPath = path.join(stage, `${target.outputBase}.png`)
        await page.screenshot({ path: pngPath, animations: 'disabled' })
        await encodeMarketingWebp(pngPath, path.join(stage, `${target.outputBase}.webp`), 90)
        await encodeMarketingWebp(pngPath, path.join(stage, `${target.outputBase}_sm.webp`), 86, target.isMobile ? 540 : 1280)
      } finally {
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
  if (!skipS3) {
    console.log('\n☁️ Automatically syncing marketing mockups to Neon S3 CDN...')
    execSync('npm run s3:sync', { stdio: 'inherit' })
    console.log('✅ Marketing mockups synced to Neon S3 with 100% asset parity!')
  } else {
    console.log('\n⏭️ Skipped S3 sync (--skip-s3 passed).')
  }
}

main().catch((err) => {
  console.error('❌ Capture failed:', err)
  process.exit(1)
})
