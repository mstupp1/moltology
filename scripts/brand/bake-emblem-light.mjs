#!/usr/bin/env node
/**
 * Bakes the 3D emblem's light into public/images/emblem/: two matcaps and a turntable strip.
 * Bundles scripts/brand/emblem-light.entry.ts, runs it in Playwright's Chromium (software WebGL is
 * fine, it renders once), and writes the WebP files it returns.
 *
 * Run after changing the emblem geometry, its colours, or the turntable settings in
 * src/lib/emblem-light.ts:  npm run emblem:bake
 */
import { build } from 'esbuild'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const outDir = path.join(root, 'public/images/emblem')

const bundle = await build({
  entryPoints: [path.join(root, 'scripts/brand/emblem-light.entry.ts')],
  bundle: true,
  write: false,
  format: 'iife',
  jsx: 'automatic',
  loader: { '.json': 'json' },
  alias: { '@': path.join(root, 'src') },
  logLevel: 'error',
})

// Any Chrome or Chromium will do; COMPOSITE_CHROME_PATH wins, as in the other render scripts.
const executablePath = [
  process.env.COMPOSITE_CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/opt/pw-browsers/chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((candidate) => candidate && existsSync(candidate))
if (!executablePath) throw new Error('Install Chrome/Chromium or set COMPOSITE_CHROME_PATH.')

const browser = await chromium.launch({ executablePath, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] })
try {
  const page = await browser.newPage()
  await page.setContent('<!doctype html><html><body></body></html>')
  await page.addScriptTag({ content: bundle.outputFiles[0].text })
  await page.waitForFunction(() => window.emblemBake, null, { timeout: 60_000 })
  const result = await page.evaluate(() => window.emblemBake)
  if (result.error) throw new Error(result.error)
  await mkdir(outDir, { recursive: true })
  for (const [name, file] of [
    ['cap', 'matcap-cap.webp'],
    ['bevel', 'matcap-bevel.webp'],
    ['strip', 'turntable.webp'],
  ]) {
    const data = Buffer.from(result[name].split(',')[1], 'base64')
    await writeFile(path.join(outDir, file), data)
    console.log(`${file}  ${(data.length / 1024).toFixed(1)} KB`)
  }
} finally {
  await browser.close()
}
