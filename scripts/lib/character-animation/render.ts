/**
 * Draws a timeline frame by frame in headless Chrome with the site's own 3D character code, and
 * writes each frame as a transparent PNG. On a Mac, Chrome draws on the GPU (fast); on Linux it
 * falls back to software WebGL (slow, fine for short tests at reduced size).
 */
import fs from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'
import type { AnimationTimeline } from '../../../src/lib/avatar3d/scripted'
import { resolveChromeExecutable } from '../composite-renderer'

async function bundlePlayer(): Promise<string> {
  const result = await build({
    entryPoints: [path.resolve(path.dirname(new URL(import.meta.url).pathname), 'player-entry.ts')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2022',
    write: false,
    minify: true,
    alias: { '@': path.resolve(process.cwd(), 'src') },
    define: { 'process.env.NODE_ENV': '"production"' },
    logLevel: 'error',
  })
  return result.outputFiles[0].text
}

export interface RenderFramesOptions {
  outDir: string
  /** Called every so often with frames done and total. */
  onProgress?: (done: number, total: number, msPerFrame: number) => void
}

/** Renders every frame of the timeline into outDir as 00000.png, 00001.png, ... */
export async function renderFrames(timeline: AnimationTimeline, options: RenderFramesOptions): Promise<{ frames: number; seconds: number }> {
  fs.mkdirSync(options.outDir, { recursive: true })
  const bundle = await bundlePlayer()
  const { chromium } = await import('playwright-core')
  const software = process.platform === 'linux'
  const extra = process.env.ANIM_CHROME_ARGS?.split(/\s+/).filter(Boolean) ?? []
  const browser = await chromium.launch({
    executablePath: resolveChromeExecutable(),
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--hide-scrollbars',
      ...(software ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []),
      ...extra,
    ],
  })
  const started = Date.now()
  try {
    const page = await browser.newPage({ viewport: { width: timeline.width, height: timeline.height }, deviceScaleFactor: 1 })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setContent('<!doctype html><html><body style="margin:0;background:transparent"></body></html>')
    await page.addScriptTag({ content: bundle })
    await page.evaluate((t) => window.__anim.setup(t), timeline)
    if (errors.length) throw new Error(`3D stage failed: ${errors.join('; ')}`)
    let last = Date.now()
    for (let i = 0; i < timeline.frames; i++) {
      const url = await page.evaluate((index) => window.__anim.frame(index), i)
      fs.writeFileSync(path.join(options.outDir, `${String(i).padStart(5, '0')}.png`), Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))
      if (options.onProgress && (i % 30 === 29 || i === timeline.frames - 1)) {
        const now = Date.now()
        options.onProgress(i + 1, timeline.frames, (now - last) / Math.min(30, i + 1))
        last = now
      }
    }
    if (errors.length) throw new Error(`3D stage failed: ${errors.join('; ')}`)
  } finally {
    await browser.close().catch(() => undefined)
  }
  return { frames: timeline.frames, seconds: (Date.now() - started) / 1000 }
}
