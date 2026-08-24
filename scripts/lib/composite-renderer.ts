import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { CompositeAspectRatio, COMPOSITE_DIMENSIONS } from '../../src/components/composite/CompositeContainer'
import { CompositeTemplateType } from '../../src/components/composite/CompositeStudioUI'
import { MascotKey } from '../../src/components/composite/MascotOverlay'

export { COMPOSITE_DIMENSIONS }
export type { CompositeAspectRatio, CompositeTemplateType, MascotKey }

export const DEFAULT_PORT = 3019
export const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

export interface CaptureCompositeOptions {
  template?: CompositeTemplateType
  theme?: 'moltmaxxing' | 'pincer-torque' | 'ecdysis' | 'benthic-depth' | 'quiz' | string
  aspectRatio?: CompositeAspectRatio
  mascot?: MascotKey
  data?: Record<string, any>
  outputPath: string
  port?: number
  scaleFactor?: number // default 2 for 2x Retina High-DPI
  baseUrl?: string
  waitDelayMs?: number // default 1500ms for web fonts, Tailwind, and S3 images to settle
}

/**
 * Check if a server is responsive at the given URL
 */
export function checkServerLiveness(url: string, timeoutMs = 2000): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      resolve(Boolean(res.statusCode && res.statusCode < 500))
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
 * Build the URL for composite capture
 */
export function buildCompositeUrl(options: {
  baseUrl: string
  template?: string
  theme?: string
  aspectRatio?: string
  mascot?: string
  data?: Record<string, any>
}): string {
  const url = new URL('/render/composite', options.baseUrl)
  url.searchParams.set('mode', 'raw')
  url.searchParams.set('preview', 'true') // bypass auth guard for headless internal snapshotting

  if (options.template) url.searchParams.set('template', options.template)
  if (options.theme) url.searchParams.set('theme', options.theme)
  if (options.aspectRatio) url.searchParams.set('aspect', options.aspectRatio)
  if (options.mascot) url.searchParams.set('mascot', options.mascot)
  if (options.data && Object.keys(options.data).length > 0) {
    url.searchParams.set('data', encodeURIComponent(JSON.stringify(options.data)))
  }

  return url.toString()
}

/**
 * Capture High-DPI Composite Screenshot via Headless Chrome
 */
export async function captureComposite(options: CaptureCompositeOptions): Promise<string> {
  const port = options.port || DEFAULT_PORT
  const baseUrl = options.baseUrl || `http://127.0.0.1:${port}`
  const aspect = options.aspectRatio || '4:5'
  const dims = COMPOSITE_DIMENSIONS[aspect] || COMPOSITE_DIMENSIONS['4:5']
  const scale = options.scaleFactor ?? 2
  const delay = options.waitDelayMs ?? 1500

  const outDir = path.dirname(options.outputPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // 1. Check if server is already running (e.g. active dev server on 3000 or prod on 3019)
  let spawnedServer: any = null
  const isRunning = await checkServerLiveness(`${baseUrl}/render/composite?mode=raw&preview=true`)

  if (!isRunning) {
    // Check if dev server is running on port 3000
    const devRunning = await checkServerLiveness('http://127.0.0.1:3000/render/composite?mode=raw&preview=true')
    if (devRunning) {
      options.baseUrl = 'http://127.0.0.1:3000'
    } else {
      console.log(`🚀 Spawning Moltology server for composite capture on port ${port}...`)
      // Check if build exists, otherwise build
      if (!fs.existsSync(path.resolve('.output/server/index.mjs'))) {
        console.log('⚙️ Building production bundle...')
        execSync('npm run build', { stdio: 'inherit' })
      }

      spawnedServer = spawn('node', ['.output/server/index.mjs'], {
        env: { ...process.env, PORT: String(port), NODE_ENV: 'production' },
        stdio: 'ignore',
      })

      await waitForServer(`${baseUrl}/render/composite?mode=raw&preview=true`)
    }
  }

  try {
    const targetUrl = buildCompositeUrl({
      baseUrl: options.baseUrl || baseUrl,
      template: options.template,
      theme: options.theme,
      aspectRatio: options.aspectRatio,
      mascot: options.mascot,
      data: options.data,
    })

    console.log(`📸 Capturing High-DPI Composite (${dims.width}×${dims.height} @ ${scale}x Retina)...`)
    console.log(`   • URL: ${targetUrl}`)
    console.log(`   • Output: ${options.outputPath}`)

    // Chrome headless screenshot command with virtual time budget for asset settling
    const chromeCmd = `"${CHROME_PATH}" --headless=new --disable-gpu --hide-scrollbars --allow-running-insecure-content --disable-web-security --virtual-time-budget=${delay} --window-size=${dims.width},${dims.height} --force-device-scale-factor=${scale} --screenshot="${options.outputPath}" "${targetUrl}"`

    // Execute Chrome snapshot
    execSync(chromeCmd, { stdio: 'inherit' })

    if (!fs.existsSync(options.outputPath)) {
      throw new Error(`Screenshot capture failed, file not created: ${options.outputPath}`)
    }

    const stats = fs.statSync(options.outputPath)
    console.log(`✅ Pristine composite captured successfully! (${(stats.size / 1024).toFixed(1)} KB) -> ${options.outputPath}`)
    return options.outputPath
  } finally {
    if (spawnedServer) {
      spawnedServer.kill('SIGTERM')
    }
  }
}
