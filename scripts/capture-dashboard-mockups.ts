import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

const PORT = 3019
const BASE_URL = `http://127.0.0.1:${PORT}`
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUTPUT_DIR = path.resolve('public/images/marketing')

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

function waitForServer(url: string, timeoutMs = 15000): Promise<void> {
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
        setTimeout(check, 300)
      }
    }

    check()
  })
}

async function main() {
  console.log('📸 Starting automated dashboard mockup capture pipeline...')

  // 1. Always build production bundle to ensure latest code is captured
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

    // Give 2 seconds for UI, icons, and canvas to settle
    await new Promise((r) => setTimeout(r, 2000))

    // 3. Capture Desktop at 1760x1100 (MacBook Pro Panoramic 16:10 Ratio, 2x Retina)
    const desktopOut = path.join(OUTPUT_DIR, 'dashboard_desktop_preview.png')
    console.log(`🖥️ Capturing Desktop HUD mockup (1760x1100 @ 2x) to ${desktopOut}...`)
    execSync(
      `"${CHROME_PATH}" --headless=new --disable-gpu --hide-scrollbars --window-size=1760,1100 --force-device-scale-factor=2 --screenshot="${desktopOut}" "${BASE_URL}/dashboard?preview=true"`,
      { stdio: 'inherit' }
    )
    console.log('✅ Desktop HUD captured successfully!')

    // 4. Capture Mobile at 393x852 (iPhone 15 Pro True Screen Ratio, 2x Retina)
    const mobileOut = path.join(OUTPUT_DIR, 'dashboard_mobile_preview.png')
    console.log(`📱 Capturing Mobile HUD mockup (393x852 @ 2x) to ${mobileOut}...`)
    const iphoneUA =
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    execSync(
      `"${CHROME_PATH}" --headless=new --disable-gpu --hide-scrollbars --window-size=393,852 --force-device-scale-factor=2 --user-agent="${iphoneUA}" --screenshot="${mobileOut}" "${BASE_URL}/dashboard?preview=true"`,
      { stdio: 'inherit' }
    )
    console.log('✅ Mobile HUD captured successfully!')

    console.log('\n🎉 ALL DASHBOARD MOCKUP SCREENSHOTS CAPTURED WITH 100% VISUAL FIDELITY!')
  } finally {
    serverProcess.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error('❌ Capture failed:', err)
  process.exit(1)
})
