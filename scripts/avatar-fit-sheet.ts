/**
 * Gear fit check: renders every equipment item on both races, across head shapes,
 * builds and poses, plus every expression and mouth, into one contact sheet.
 * Run it after adding or changing gear and look for anything floating, clipping
 * the face, or not matching the limb it sits on.
 *
 *   npm run avatar:fit                 -> tmp/avatar-fit/sheet.html (+ sheet.png when Playwright is available)
 *   npm run avatar:fit -- --only legs  -> one category (head, carapace, claws, legs, antennae, belt, face)
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { generateLobsterAvatarSvg, LOBSTER_EYELID_STYLES, stripSvgSmilAnimation } from '../src/lib/lobster-avatar'
import { EQUIPMENT_VISUALS } from '../src/lib/avatar/equipment'
import { AVATAR_MOUTHS } from '../src/lib/avatar/traits'

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined
const outDir = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : 'tmp/avatar-fit')
const races = ['lobster', 'crab'] as const
const shapes = ['bean', 'round', 'tall', 'wide', 'square', 'heart'] as const
const builds = ['classic', 'slim', 'chunky', 'barrel', 'tapered'] as const
const poses = ['rest', 'cheer', 'wave', 'flex'] as const

const cell = (config: Record<string, unknown>, label: string, frame: 'fullBody' | 'portrait') =>
  `<figure>${stripSvgSmilAnimation(generateLobsterAvatarSvg({ style: 'critters', height: 'regular', ...config } as never, 180, { frame }) ?? '')}<figcaption>${label}</figcaption></figure>`

const sections: string[] = []
const categories = ['head', 'carapace', 'claws', 'legs', 'antennae', 'belt'] as const
for (const category of categories) {
  if (only && only !== category) continue
  const cells: string[] = []
  for (const v of Object.values(EQUIPMENT_VISUALS).filter((item) => item.category === category)) {
    const equipment = category === 'claws' ? { 'claws-1': { visualKey: v.key }, 'claws-2': { visualKey: v.key } } : { [category]: { visualKey: v.key } }
    for (const race of races)
      for (let i = 0; i < shapes.length; i++) {
        const pose = poses[i % poses.length]
        const build = builds[i % builds.length]
        cells.push(cell({ seed: `fit-${i}`, race, pose, headShape: shapes[i], build, equipment }, `${v.key} · ${race} ${shapes[i]}/${build} ${pose}`, category === 'head' ? 'portrait' : 'fullBody'))
      }
  }
  sections.push(`<h2>${category}</h2><div class="g">${cells.join('')}</div>`)
}
if (!only || only === 'face') {
  const cells: string[] = []
  for (const race of races) {
    for (const eyelidStyle of LOBSTER_EYELID_STYLES) cells.push(cell({ seed: 'face', race, eyelidStyle, mouth: 'smile' }, `${race} ${eyelidStyle}`, 'portrait'))
    for (const mouth of AVATAR_MOUTHS) cells.push(cell({ seed: 'face', race, eyelidStyle: 'relaxed', mouth }, `${race} mouth ${mouth}`, 'portrait'))
  }
  sections.push(`<h2>face</h2><div class="g">${cells.join('')}</div>`)
}

mkdirSync(outDir, { recursive: true })
const html = `<!doctype html><meta charset="utf-8"><title>Avatar fit check</title><body style="background:#0b1220;color:#ccd;font:11px system-ui;margin:12px"><style>.g{display:grid;grid-template-columns:repeat(12,180px);gap:6px}figure{margin:0}svg{width:180px;height:180px;display:block}figcaption{height:28px;overflow:hidden}h2{font-size:14px;margin:18px 0 6px}</style>${sections.join('')}</body>`
const htmlPath = resolve(outDir, 'sheet.html')
writeFileSync(htmlPath, html)
console.log(`[avatar:fit] wrote ${htmlPath}`)

try {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 2250, height: 1000 } })
  await page.goto(`file://${htmlPath}`)
  await page.screenshot({ path: resolve(outDir, 'sheet.png'), fullPage: true })
  await browser.close()
  console.log(`[avatar:fit] wrote ${resolve(outDir, 'sheet.png')}`)
} catch {
  console.log('[avatar:fit] Playwright not available; open the HTML instead.')
}
