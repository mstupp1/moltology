import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'
import geometry from '../src/components/ui/brand-geometry.json'
import { generateLobsterAvatarSvg } from '../src/lib/lobster-avatar'
import { resolveChromeExecutable } from './lib/composite-renderer'

// Evergreen product artwork, rendered from the existing member character rig.
// Rebuild, inspect, then upload with scripts/upload-asset.ts; never commit the PNG.
const output = path.resolve(process.argv[2] || 'tmp/verification/profile-previews/member-invite-v1.png')
await fs.mkdir(path.dirname(output), { recursive: true })
const font = (await fs.readFile('public/fonts/space-grotesk-latin-bold.woff2')).toString('base64')
const bodyFont = (await fs.readFile('public/fonts/inter-latin.woff2')).toString('base64')
const icon = geometry.parts.icon
const character = generateLobsterAvatarSvg({
  style: 'critters', seed: 'a-friend-beneath-the-surface', race: 'crab',
  shellColor: 'coral', eyelidStyle: 'cheerful_squint', accessory: 'none',
}, 520, { frame: 'portrait', staticMotion: true })
const html = `<!doctype html><html><head><style>
@font-face{font-family:Grotesk;src:url(data:font/woff2;base64,${font})}
@font-face{font-family:Inter;src:url(data:font/woff2;base64,${bodyFont})}
*{box-sizing:border-box}body{margin:0;width:1200px;height:630px;overflow:hidden;background:#060e10;color:#edf4f1;font-family:Grotesk}
.canvas{position:relative;width:100%;height:100%;padding:62px 68px;background:radial-gradient(ellipse at 84% 45%,#163e43 0,transparent 58%)}
.brand{display:flex;align-items:center;gap:16px;font-size:54px;letter-spacing:-2px}.brand svg{width:52px;height:52px;fill:#ff453a}
.copy{position:relative;z-index:2;margin-top:56px}.copy h1{margin:0;font-size:72px;line-height:1.04;letter-spacing:-3px;font-weight:700}
.copy p{margin:24px 0 0;font-family:Inter;font-size:24px;color:#a5bab9;line-height:1.45}
.action{display:flex;align-items:center;gap:14px;margin-top:38px;font-size:22px;color:#33d2f5}.action svg{width:24px;height:24px}
.portrait{position:absolute;right:57px;top:85px;width:475px;height:475px;border-radius:50%;background:radial-gradient(circle at 40% 30%,#24555a,#0c2024 72%);border:1px solid #35646a;box-shadow:0 32px 80px #0008,inset 0 0 0 12px #08181d;overflow:hidden}
.portrait svg{width:100%;height:100%;transform:scale(1.04)}
.domain{position:absolute;right:80px;bottom:48px;font-family:Inter;font-size:18px;color:#849f9f;letter-spacing:.4px}
</style></head><body><main class="canvas">
<div class="brand"><svg viewBox="${icon.viewBox}"><g transform="${icon.transform}"><path fill-rule="evenodd" d="${icon.d}"/></g></svg>Moltology</div>
<div class="copy"><h1>Better with<br>a friend.</h1><p>A friend beneath the surface.</p><div class="action"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 8v6m-3-3h6"/><circle cx="9" cy="7" r="4"/></svg>Add me on Moltology <span>→</span></div></div>
<div class="portrait">${character}</div><div class="domain">moltology.org</div>
</main></body></html>`
const browser = await chromium.launch({ executablePath: resolveChromeExecutable(), headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  await page.setContent(html)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: output })
} finally { await browser.close() }
console.log(`Rendered ${output}`)
