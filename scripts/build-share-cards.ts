/**
 * Draws the link-preview images (og:image). Run `npm run share:cards` after changing the artwork.
 *
 *   public/images/sharing/site-card-v2.jpg          the site card: glowing emblem over the wordmark
 *   src/lib/server/share-card-art/member-card-base.webp   member card without the portrait
 *   src/lib/server/share-card-art/member-card-glass.webp  the porthole's glass, laid over the portrait
 *   public/images/sharing/member-card-v{N}.jpg      the member card with the crab, for members
 *                                                   without a saved portrait
 *
 * Colours, type and the glass follow docs/design/ui-tokens.md, HeaderBrand, HudButton and
 * GlassLens. The crab is a 3D still kept in content/brand/share-cards/. To draw it again, start
 * the dev server and pass its address: `npm run share:cards -- --crab-from http://localhost:3000`
 * (it renders CRAB below with renderStill, 512px portrait).
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chromium, type Browser } from 'playwright-core'
import sharp from 'sharp'
import { resolveChromeExecutable } from './lib/composite-renderer'
import { MEMBER_SHARE_FALLBACK_IMAGE, SHARE_CARD_LENS, SHARE_CARD_SIZE, SITE_SHARE_IMAGE } from '../src/lib/share-card'
import { composeMemberCard } from '../src/lib/server/share-card'

const root = fileURLToPath(new URL('../', import.meta.url))
const at = (...parts: string[]) => path.join(root, ...parts)
const fileUrl = (...parts: string[]) => pathToFileURL(at(...parts)).href

const CRAB_PORTRAIT = at('content/brand/share-cards/crab-portrait-512.webp')
const ART_DIR = at('src/lib/server/share-card-art')

/** The fallback character: a crimson crab, glossy, in the ready stance. */
const CRAB = { style: 'critters', seed: 'og-crab-1', race: 'crab', shellColor: 'crimson', shellFinish: 'glossy', pose: 'ready' }

// Tokens from tailwind.config.js.
const T = {
  abyss: '#030708',
  surface2: '#101a1c',
  surface3: '#172325',
  ink: '#e4e9e9',
  inkBody: '#c3cdcd',
  inkMuted: '#8fa0a0',
  cyan: '#00c3ff',
  crimson: '#ff453a',
}

const { width: W, height: H } = SHARE_CARD_SIZE
const L = SHARE_CARD_LENS

async function emblemSvg(): Promise<string> {
  const svg = await fs.readFile(at('public/images/order_emblem.svg'), 'utf8')
  return svg.replace(/<title>.*?<\/title>/, '').replace('<svg ', '<svg class="emblem" ')
}

function page(body: string, css: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Space Grotesk';src:url(${fileUrl('public/fonts/space-grotesk-latin.woff2')});font-weight:300 700}
@font-face{font-family:'Space Grotesk';src:url(${fileUrl('public/fonts/space-grotesk-latin-bold.woff2')});font-weight:800}
@font-face{font-family:'Inter';src:url(${fileUrl('public/fonts/inter-latin.woff2')});font-weight:400 700}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;font-family:'Space Grotesk',sans-serif;color:${T.ink};-webkit-font-smoothing:antialiased}
.abs{position:absolute}
${css}
</style></head><body>${body}</body></html>`
}

/** HeaderBrand: emblem, then "Moltology" over the tagline spread to the title's width. */
function lockup(emblem: string, titlePx: number): string {
  const letters = Array.from('THE SYNAPTIC PATH').map((c) => (c === ' ' ? '<span class="gap"></span>' : `<span>${c}</span>`)).join('')
  return `<div class="lockup" style="font-size:${titlePx}px">${emblem}<div class="words"><div class="title">Moltology</div><div class="caption">${letters}</div></div></div>`
}

const LOCKUP_CSS = `
.lockup{display:flex;align-items:center;gap:.42em}
.lockup .emblem{width:1.45em;height:1.45em;flex:none}
.lockup .emblem g{fill:${T.crimson}}
.words{display:inline-grid;line-height:1;white-space:nowrap}
.title{font-weight:800;letter-spacing:-.025em;color:${T.ink}}
.caption{margin-top:.65em;font-size:.4em;font-weight:400;color:${T.inkMuted};display:flex;justify-content:space-between;gap:.08em}
.caption .gap{width:.3em}
`

/** The approved black-tee composition: large red emblem over the stacked merch wordmark. */
async function siteCard(emblem: string): Promise<string> {
  return page(
    `<div class="abs ground"></div><div class="abs halo"></div>
     <div class="abs mark">${emblem}</div>
     <img class="abs word" src="${fileUrl('content/brand/synaptic-path/parts/merch-v2/moltology-stacked-dark.svg')}" alt="">`,
    `.ground{inset:0;background:
        radial-gradient(ellipse 55% 70% at 50% 34%,rgba(255,69,58,.2) 0%,rgba(105,18,0,.1) 40%,transparent 72%),
        radial-gradient(ellipse 60% 22% at 50% 104%,rgba(0,195,255,.16) 0%,transparent 100%),${T.abyss}}
     .halo{left:50%;top:205px;width:500px;height:500px;margin:-250px 0 0 -250px;border-radius:50%;background:radial-gradient(circle,rgba(255,69,58,.3) 0%,transparent 60%)}
     .mark{left:50%;top:64px;width:284px;height:284px;margin-left:-142px;filter:drop-shadow(0 0 32px rgba(255,69,58,.55))}
     .mark .emblem{width:100%;height:100%}
     .mark .emblem g{fill:${T.crimson}}
     .word{left:50%;top:384px;width:400px;margin-left:-200px}`,
  )
}

// lucide user-plus
const USER_PLUS = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>`

async function memberBase(emblem: string): Promise<string> {
  const cx = L.x + L.size / 2
  const cy = L.y + L.size / 2
  return page(
    `<div class="abs ground"></div>
     <div class="abs" style="left:72px;top:68px">${lockup(emblem, 40)}</div>
     <h1 class="abs head">Better with<br>a friend.</h1>
     <p class="abs sub">A friend beneath the surface.</p>
     <div class="abs cta"><span class="fill"></span><span class="label">${USER_PLUS}Add me on Moltology</span></div>
     <div class="abs url">moltology.org</div>
     <div class="abs lens"></div>`,
    `${LOCKUP_CSS}
     .ground{inset:0;background:
        radial-gradient(circle at ${cx}px ${cy}px,rgba(0,195,255,.16) 0%,rgba(0,55,74,.22) 30%,transparent 55%),
        linear-gradient(180deg,#071012 0%,${T.abyss} 100%)}
     .head{left:72px;top:214px;font-size:78px;font-weight:700;letter-spacing:-.02em;line-height:1.02;color:${T.ink}}
     .sub{left:72px;top:400px;font-family:Inter,sans-serif;font-size:26px;color:${T.inkBody}}
     .cta{left:72px;top:462px;height:60px;padding:0 28px;display:flex;align-items:center}
     .cta .fill{position:absolute;inset:0;background:${T.cyan};border-radius:12px}
     .cta .label{position:relative;display:flex;align-items:center;gap:12px;color:${T.abyss};font-family:Inter,sans-serif;font-weight:600;font-size:22px}
     .cta svg{width:24px;height:24px}
     .url{left:72px;bottom:44px;font-family:Inter,sans-serif;font-size:20px;color:${T.inkMuted}}
     .lens{left:${L.x}px;top:${L.y}px;width:${L.size}px;height:${L.size}px;border-radius:50%;
        background:radial-gradient(circle at 50% 38%,${T.surface3} 0%,${T.surface2} 55%,#081012 100%);
        box-shadow:0 0 0 1px rgba(255,255,255,.2),0 18px 50px rgba(0,0,0,.6),0 0 44px rgba(0,195,255,.22)}`,
  )
}

/** GlassLens at card size: sheen, lens vignette, cyan underglow, lit inner edge, highlight line. */
function glass(): string {
  return `<!doctype html><html><head><style>
*{margin:0}html,body{width:${L.size}px;height:${L.size}px;background:transparent;overflow:hidden}
.g{position:absolute;inset:0;border-radius:50%;
  background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,.26) 0%,rgba(0,195,255,.14) 35%,transparent 70%),
    radial-gradient(circle at 50% 40%,transparent 58%,rgba(2,8,14,.32) 80%,rgba(1,4,7,.7) 100%),
    radial-gradient(ellipse 70% 28% at 50% 100%,rgba(0,195,255,.2) 0%,transparent 100%);
  box-shadow:inset 0 0 0 2px rgba(34,211,238,.22),inset 0 0 18px rgba(0,195,255,.24)}
.line{position:absolute;top:2px;left:22%;right:22%;height:2px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.9),transparent)}
.clip{position:absolute;inset:0;border-radius:50%;overflow:hidden}
</style></head><body><div class="clip"><div class="g"></div><div class="line"></div></div></body></html>`
}

async function shoot(browser: Browser, html: string, size: { width: number; height: number }, transparent = false): Promise<Buffer> {
  const tab = await browser.newPage({ viewport: size, deviceScaleFactor: 1 })
  const file = at('tmp', `share-card-${Date.now()}.html`)
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, html)
  await tab.goto(pathToFileURL(file).href)
  await tab.evaluate(() => document.fonts.ready)
  const shot = await tab.screenshot({ omitBackground: transparent, type: 'png' })
  await tab.close()
  await fs.rm(file)
  return shot
}

async function renderCrab(appUrl: string, browser: Browser): Promise<void> {
  const tab = await browser.newPage()
  await tab.goto(appUrl, { waitUntil: 'load', timeout: 120_000 })
  const url = await tab.evaluate(async (config) => {
    const portraits = await import('/src/lib/avatar3d/portraits.ts' as string)
    const looks = await import('/src/lib/avatar3d/look.ts' as string)
    return portraits.renderStill(looks.lookFromConfig(config), 512, 'portrait') as string
  }, CRAB)
  await tab.close()
  await fs.writeFile(CRAB_PORTRAIT, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))
  console.log('crab portrait drawn again')
}

async function main() {
  const executablePath = resolveChromeExecutable()
  if (!executablePath) throw new Error('Install Chrome/Chromium or set COMPOSITE_CHROME_PATH.')
  const crabFrom = process.argv.indexOf('--crab-from')
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: ['--hide-scrollbars', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  })
  try {
    if (crabFrom > 0) await renderCrab(process.argv[crabFrom + 1], browser)
    const emblem = await emblemSvg()
    await fs.mkdir(at('public/images/sharing'), { recursive: true })
    await fs.mkdir(ART_DIR, { recursive: true })

    const site = await shoot(browser, await siteCard(emblem), SHARE_CARD_SIZE)
    await sharp(site).jpeg({ quality: 88, mozjpeg: true }).toFile(at('public', SITE_SHARE_IMAGE))

    const base = await sharp(await shoot(browser, await memberBase(emblem), SHARE_CARD_SIZE)).webp({ quality: 92 }).toBuffer()
    const lens = await sharp(await shoot(browser, glass(), { width: L.size, height: L.size }, true)).webp({ quality: 90, alphaQuality: 100 }).toBuffer()
    await fs.writeFile(path.join(ART_DIR, 'member-card-base.webp'), base)
    await fs.writeFile(path.join(ART_DIR, 'member-card-glass.webp'), lens)

    const fallback = await composeMemberCard(base, lens, await fs.readFile(CRAB_PORTRAIT))
    await fs.writeFile(at('public', MEMBER_SHARE_FALLBACK_IMAGE), fallback)
    console.log('share cards written')
  } finally {
    await browser.close()
  }
}

await main()
