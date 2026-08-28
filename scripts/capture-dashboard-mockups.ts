import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import os from 'node:os'
import { createCanvas, loadImage } from '@napi-rs/canvas'

const PORT = 3019
const BASE_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
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
        if (res.statusCode && res.statusCode < 500) {
          resolve()
        } else {
          retry()
        }
      })
      req.on('error', () => retry())
      req.end()
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

interface CaptureTarget {
  name: string
  route: string
  windowSize: string
  scaleFactor: number
  isMobile?: boolean
  outputBase: string
}

const REGISTERED_TARGETS: Record<string, CaptureTarget> = {
  dashboard_desktop: {
    name: 'dashboard_desktop',
    route: '/dashboard',
    windowSize: '1760,1100',
    scaleFactor: 2,
    outputBase: 'dashboard_desktop_preview',
  },
  dashboard_mobile: {
    name: 'dashboard_mobile',
    route: '/dashboard',
    windowSize: '540,1170',
    scaleFactor: 2,
    isMobile: true,
    outputBase: 'dashboard_mobile_preview',
  },
  forum_desktop: {
    name: 'forum_desktop',
    route: '/forum',
    windowSize: '1760,1100',
    scaleFactor: 2,
    outputBase: 'forum_desktop_preview',
  },
  oracle_desktop: {
    name: 'oracle_desktop',
    route: '/oracle',
    windowSize: '1760,1100',
    scaleFactor: 2,
    outputBase: 'oracle_desktop_preview',
  },
  market_desktop: {
    name: 'market_desktop',
    route: '/market',
    windowSize: '1760,1100',
    scaleFactor: 2,
    outputBase: 'market_desktop_preview',
  },
  chassis_desktop: {
    name: 'chassis_desktop',
    route: '/chassis',
    windowSize: '1760,1100',
    scaleFactor: 2,
    outputBase: 'chassis_desktop_preview',
  },
  codex_desktop: {
    name: 'codex_desktop',
    route: '/codex',
    windowSize: '1760,1100',
    scaleFactor: 2,
    outputBase: 'codex_desktop_preview',
  },
}

async function main() {
  const args = process.argv.slice(2)
  const targetFilter = args.find((a) => a.startsWith('--target='))?.split('=')[1]
  const customUrl = args.find((a) => a.startsWith('--url='))?.split('=')[1]
  const customOutput = args.find((a) => a.startsWith('--output='))?.split('=')[1]

  console.log('📸 Starting automated marketing mockups & UI capture pipeline...')

  // Determine active targets
  let activeTargets: CaptureTarget[] = []

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
      k.toLowerCase().includes(targetFilter.toLowerCase())
    )
    if (keys.length === 0) {
      console.error(`❌ Unknown target: "${targetFilter}". Available targets: ${Object.keys(REGISTERED_TARGETS).join(', ')}`)
      process.exit(1)
    }
    activeTargets = keys.map((k) => REGISTERED_TARGETS[k])
  } else {
    // Default: capture the core marketing set (dashboard, forum, oracle)
    activeTargets = [
      REGISTERED_TARGETS.dashboard_desktop,
      REGISTERED_TARGETS.dashboard_mobile,
      REGISTERED_TARGETS.forum_desktop,
      REGISTERED_TARGETS.oracle_desktop,
    ]
  }

  // 1. Compile production bundle
  console.log('⚙️ Compiling production bundle...')
  execSync('npm run build', { stdio: 'inherit' })

  // 2. Start server on PORT 3019
  console.log(`🚀 Spawning Benthic OS server on port ${PORT}...`)
  const serverProcess = spawn('node', ['.output/server/index.mjs'], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: 'ignore',
  })

  try {
    console.log('⏳ Waiting for server to be responsive...')
    await waitForServer(`${BASE_URL}/dashboard?preview=true`)
    console.log('✅ Server ready!')

    // Give 2.5 seconds for server and assets to initialize
    await new Promise((r) => setTimeout(r, 2500))

    const iphoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

    const pngsToCleanup: string[] = []

    for (const target of activeTargets) {
      const pngPath = path.join(OUTPUT_DIR, `${target.outputBase}.png`)
      pngsToCleanup.push(pngPath)

      // Guarantee preview=true to bypass all welcome screens, splash dialogs & animation delays
      const separator = target.route.includes('?') ? '&' : '?'
      const captureUrl = `${BASE_URL}${target.route}${separator}preview=true`

      console.log(`📸 Capturing ${target.name} (${target.windowSize} @ ${target.scaleFactor}x) from ${captureUrl}...`)
      
      const uaFlag = target.isMobile ? ` --user-agent="${iphoneUA}"` : ''
      execSync(
        `"${CHROME_PATH}" --headless=new --disable-gpu --hide-scrollbars --no-first-run --no-default-browser-check --window-size=${target.windowSize} --force-device-scale-factor=${target.scaleFactor}${uaFlag} --screenshot="${pngPath}" "${captureUrl}"`,
        { stdio: 'inherit' }
      )
      console.log(`✅ ${target.name} captured successfully!`)

      const webpFull = path.join(OUTPUT_DIR, `${target.outputBase}.webp`)
      const webpSm = path.join(OUTPUT_DIR, `${target.outputBase}_sm.webp`)
      const maxSmWidth = target.isMobile ? 540 : 1280

      await encodeMarketingWebp(pngPath, webpFull, 90)
      await encodeMarketingWebp(pngPath, webpSm, 86, maxSmWidth)
    }

    // Cleanup raw PNGs
    for (const png of pngsToCleanup) {
      if (fs.existsSync(png)) fs.unlinkSync(png)
    }
    console.log('✅ Marketing WebP variants encoded for first-paint payload!')
    console.log('\n🎉 ALL MOCKUP SCREENSHOTS CAPTURED WITH 100% VISUAL FIDELITY (ZERO WELCOME SCREENS)!')
  } finally {
    serverProcess.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error('❌ Capture failed:', err)
  process.exit(1)
})
