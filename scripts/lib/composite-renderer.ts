import { spawn, execSync, type ChildProcess } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import type { Browser } from 'playwright-core'
import { CompositeAspectRatio, COMPOSITE_DIMENSIONS } from '../../src/components/composite/CompositeContainer'
import { CompositeTemplateType } from '../../src/components/composite/CompositeStudioUI'
import { MascotKey, normalizeMascotKey } from '../../src/components/composite/MascotOverlay'
import { frameStats, inlineLocalImages, resizeImage } from './composite-image-tools'

export { COMPOSITE_DIMENSIONS }
export type { CompositeAspectRatio, CompositeTemplateType, MascotKey }

export const DEFAULT_PORT = 3088
/** macOS default; override with COMPOSITE_CHROME_PATH. See resolveChromeExecutable. */
export const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const READY_TIMEOUT_MS = 20000

export interface CaptureCompositeOptions {
  template?: CompositeTemplateType
  theme?: 'moltmaxxing' | 'pincer-torque' | 'ecdysis' | 'benthic-depth' | 'quiz' | string
  aspectRatio?: CompositeAspectRatio
  mascot?: MascotKey
  data?: Record<string, any>
  outputPath: string
  port?: number
  scaleFactor?: number // default 2: a supersampled master for polish passes
  baseUrl?: string
  /** Extra settle time after the page reports ready (WebGL, CSS animations). Default 250ms. */
  waitDelayMs?: number
  /** Also write a downscaled copy at the platform's native size (e.g. 1080×1440). */
  nativeOutputPath?: string
  /** Write <output>.json with what was rendered and any problems. Default true. */
  writeManifest?: boolean
}

export interface CaptureCompositeResult {
  outputPath: string
  nativeOutputPath?: string
  manifestPath?: string
  width: number
  height: number
  scale: number
  /** Images that never loaded (404s, bad keys). These show as holes in the scaffold. */
  missingImages: string[]
  consoleErrors: string[]
  warnings: string[]
}

/**
 * Check if a server is responsive at the given URL
 */
export function checkServerLiveness(url: string, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(Boolean(res.statusCode && res.statusCode < 400))
    })
    req.on('error', () => resolve(false))
    req.setTimeout(timeoutMs, () => {
      req.destroy()
      resolve(false)
    })
  })
}

/**
 * Wait for server to become responsive
 */
export function waitForServer(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const check = async () => {
      const isAlive = await checkServerLiveness(url, 1000)
      if (isAlive) {
        resolve()
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not become ready within ${timeoutMs}ms`))
      } else {
        setTimeout(check, 300)
      }
    }
    check()
  })
}

/**
 * Build the URL for composite capture. With `payload: 'inject'` the page waits for the
 * payload on window instead of reading `data` from the query string.
 */
export function buildCompositeUrl(options: {
  baseUrl: string
  template?: string
  theme?: string
  aspectRatio?: string
  mascot?: string
  data?: Record<string, any>
  payload?: 'inject'
}): string {
  const url = new URL('/render/composite', options.baseUrl)
  url.searchParams.set('mode', 'raw')
  url.searchParams.set('preview', 'true') // bypass auth guard for headless internal snapshotting

  if (options.template) url.searchParams.set('template', options.template)
  if (options.theme) url.searchParams.set('theme', options.theme)
  if (options.aspectRatio) url.searchParams.set('aspect', options.aspectRatio)
  if (options.mascot) url.searchParams.set('mascot', options.mascot)
  if (options.payload) {
    url.searchParams.set('payload', options.payload)
  } else if (options.data && Object.keys(options.data).length > 0) {
    url.searchParams.set('data', encodeURIComponent(JSON.stringify(options.data)))
  }

  return url.toString()
}

/**
 * Find a Chrome/Chromium binary: COMPOSITE_CHROME_PATH, then the usual macOS and Linux
 * installs, then any Playwright-managed Chromium. Returns undefined when nothing is found.
 */
export function resolveChromeExecutable(): string | undefined {
  const candidates = [
    process.env.COMPOSITE_CHROME_PATH,
    CHROME_PATH,
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean) as string[]

  const pwRoot = process.env.PLAYWRIGHT_BROWSERS_PATH
  if (pwRoot && fs.existsSync(pwRoot)) {
    for (const dir of fs.readdirSync(pwRoot).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
      candidates.push(path.join(pwRoot, dir, 'chrome-linux', 'chrome'))
      candidates.push(path.join(pwRoot, dir, 'chrome-mac', 'Chromium.app', 'Contents', 'MacOS', 'Chromium'))
    }
  }

  return candidates.find((candidate) => fs.existsSync(candidate))
}

const TEMPLATE_SOURCE_DIRS = ['src/components/composite', 'src/routes/render', 'src/index.css', 'tailwind.config.js']

function newestMtime(target: string): number {
  if (!fs.existsSync(target)) return 0
  const stat = fs.statSync(target)
  if (!stat.isDirectory()) return stat.mtimeMs
  return fs
    .readdirSync(target)
    .reduce((max, entry) => Math.max(max, newestMtime(path.join(target, entry))), stat.mtimeMs)
}

/** True when composite templates changed after the production bundle was built. */
export function isBuildStale(cwd = process.cwd()): boolean {
  const bundle = path.resolve(cwd, '.output/server/index.mjs')
  if (!fs.existsSync(bundle)) return true
  const built = fs.statSync(bundle).mtimeMs
  return TEMPLATE_SOURCE_DIRS.some((dir) => newestMtime(path.resolve(cwd, dir)) > built)
}

export interface CompositeSessionOptions {
  port?: number
  baseUrl?: string
  /** Force `npm run build` before serving. Default: rebuild only when templates are newer. */
  rebuild?: boolean
}

export interface CompositeSession {
  baseUrl: string
  capture(options: CaptureCompositeOptions): Promise<CaptureCompositeResult>
  close(): Promise<void>
}

/**
 * One server and one browser for many captures. Carousels and reference batches should use
 * this rather than captureComposite in a loop, which starts both once per frame.
 */
export async function openCompositeSession(options: CompositeSessionOptions = {}): Promise<CompositeSession> {
  const port = options.port || DEFAULT_PORT
  const baseUrl = options.baseUrl || `http://127.0.0.1:${port}`
  const probeUrl = `${baseUrl}/render/composite?mode=raw&preview=true`

  let server: ChildProcess | null = null
  if (!(await checkServerLiveness(probeUrl))) {
    if (options.rebuild || isBuildStale()) {
      console.log('⚙️ Composite templates changed since the last build. Building production bundle...')
      execSync('npm run build', { stdio: 'inherit' })
    }
    console.log(`🚀 Starting Moltology production server for composite capture on port ${port}...`)
    server = spawn('node', ['.output/server/index.mjs'], {
      env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
      stdio: 'ignore',
    })
    await waitForServer(probeUrl, 30000)
  }

  const { chromium } = await import('playwright-core')
  const executablePath = resolveChromeExecutable()
  let browser: Browser
  try {
    browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ['--enable-webgl', '--ignore-gpu-blocklist', '--hide-scrollbars', '--font-render-hinting=none'],
    })
  } catch (err) {
    server?.kill('SIGTERM')
    throw new Error(
      `Could not launch Chrome for composite capture${executablePath ? ` (${executablePath})` : ''}. ` +
        `Install Google Chrome or set COMPOSITE_CHROME_PATH. ${(err as Error).message}`
    )
  }

  return {
    baseUrl,
    capture: (captureOptions) => captureWithBrowser(browser, baseUrl, captureOptions),
    close: async () => {
      await browser.close().catch(() => undefined)
      server?.kill('SIGTERM')
    },
  }
}

async function captureWithBrowser(
  browser: Browser,
  baseUrl: string,
  options: CaptureCompositeOptions
): Promise<CaptureCompositeResult> {
  const aspect = options.aspectRatio || '4:5'
  const dims = COMPOSITE_DIMENSIONS[aspect] || COMPOSITE_DIMENSIONS['4:5']
  const scale = options.scaleFactor ?? 2
  const warnings: string[] = []
  const consoleErrors: string[] = []

  fs.mkdirSync(path.dirname(options.outputPath), { recursive: true })

  // Resolve "random" here so the server render and the hydrated client agree on one mascot.
  const mascot = options.mascot && options.mascot !== 'none' ? normalizeMascotKey(options.mascot) : options.mascot
  const data = options.data ? inlineLocalImages(options.data) : undefined
  const payload = { template: options.template, theme: options.theme, aspect, mascot, data }

  const targetUrl = buildCompositeUrl({
    baseUrl,
    template: options.template,
    theme: options.theme,
    aspectRatio: aspect,
    mascot,
    payload: 'inject',
  })

  console.log(`📸 Capturing composite ${options.template ?? 'hook'} (${dims.width}×${dims.height} @ ${scale}x)`)
  console.log(`   • Output: ${options.outputPath}`)

  // The viewport is exactly the canvas. Chrome's --window-size includes window chrome, which
  // used to leave a black strip and cut off the bottom ~85px of every capture.
  const context = await browser.newContext({
    viewport: { width: dims.width, height: dims.height },
    deviceScaleFactor: scale,
  })
  const page = await context.newPage()
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text())
  })
  page.on('pageerror', (err) => consoleErrors.push(err.message))
  await page.addInitScript((p) => {
    ;(window as any).__COMPOSITE_PAYLOAD__ = p
  }, payload)

  let missingImages: string[] = []
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })
    try {
      await page.waitForSelector('html[data-composite-ready="true"]', { timeout: READY_TIMEOUT_MS, state: 'attached' })
    } catch {
      warnings.push(`Page did not report ready within ${READY_TIMEOUT_MS / 1000}s; captured anyway`)
    }

    const layoutError = await page.locator('[data-layout-error]').first().textContent({ timeout: 100 }).catch(() => null)
    if (layoutError) throw new Error(layoutError)

    missingImages = await page.evaluate(() => {
      const raw = document.documentElement.getAttribute('data-composite-missing')
      return raw ? (JSON.parse(raw) as string[]) : []
    })
    missingImages = missingImages.map((src) => (src.startsWith('data:') ? `${src.slice(0, 40)}…` : src))
    if (missingImages.length > 0) warnings.push(`${missingImages.length} image(s) failed to load: ${missingImages.join(', ')}`)

    await page.waitForTimeout(options.waitDelayMs ?? 250)
    await page.screenshot({
      path: options.outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: dims.width, height: dims.height },
      animations: 'disabled',
    })
  } finally {
    await context.close()
  }

  const stats = await frameStats(options.outputPath)
  const expected = { width: Math.round(dims.width * scale), height: Math.round(dims.height * scale) }
  if (stats.width !== expected.width || stats.height !== expected.height) {
    warnings.push(`Size is ${stats.width}×${stats.height}, expected ${expected.width}×${expected.height}`)
  }
  if (stats.stddev < 3) warnings.push('Frame is nearly a single flat color; it probably rendered blank')

  let nativeOutputPath: string | undefined
  if (options.nativeOutputPath) {
    await resizeImage(options.outputPath, options.nativeOutputPath, dims.width, dims.height)
    nativeOutputPath = options.nativeOutputPath
  }

  const result: CaptureCompositeResult = {
    outputPath: options.outputPath,
    nativeOutputPath,
    width: stats.width,
    height: stats.height,
    scale,
    missingImages,
    consoleErrors,
    warnings,
  }

  if (options.writeManifest !== false) {
    const manifestPath = options.outputPath.replace(/\.[^.]+$/, '') + '.json'
    fs.writeFileSync(
      manifestPath,
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          template: options.template ?? 'hook',
          theme: options.theme,
          aspect,
          mascot,
          data: options.data,
          ...result,
          manifestPath: undefined,
        },
        null,
        2
      )
    )
    result.manifestPath = manifestPath
  }

  const kb = (fs.statSync(options.outputPath).size / 1024).toFixed(1)
  console.log(`✅ Composite captured (${stats.width}×${stats.height}, ${kb} KB) -> ${options.outputPath}`)
  for (const warning of warnings) console.warn(`⚠️ ${warning}`)
  return result
}

/**
 * Capture one high-DPI composite. Starts (and stops) the server and browser around the
 * single frame; use openCompositeSession for batches.
 */
export async function captureComposite(options: CaptureCompositeOptions): Promise<string> {
  const session = await openCompositeSession({ port: options.port, baseUrl: options.baseUrl })
  try {
    const result = await session.capture(options)
    return result.outputPath
  } finally {
    await session.close()
  }
}
