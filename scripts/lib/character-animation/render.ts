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
import { S3_BASE_URL } from '../../../src/lib/assets'
import { GEAR_SURFACES, TEXTURE_MARKINGS, TEXTURE_PREFIX, TEXTURE_VERSION } from '../../../src/lib/avatar3d/textures'

/**
 * The shell textures as data URLs, for a page with no site to fetch them from (see textures.ts):
 * the packed files in tmp/avatar-textures/out when there are any, otherwise the published ones.
 */
async function textureScript(): Promise<string> {
  const dir = path.resolve(process.cwd(), `tmp/avatar-textures/out/v${TEXTURE_VERSION}`)
  const names = ['shell-detail', ...TEXTURE_MARKINGS.map((m) => `marking-${m}`), ...GEAR_SURFACES.map((g) => `gear-${g}`), 'gear-engraving']
  const files: Record<string, string> = {}
  for (const name of names) {
    const local = path.join(dir, `${name}.webp`)
    let bytes: Buffer | null = fs.existsSync(local) ? fs.readFileSync(local) : null
    if (!bytes) {
      const res = await fetch(`${S3_BASE_URL}/${TEXTURE_PREFIX}/${name}.webp`).catch(() => null)
      if (res?.ok) bytes = Buffer.from(await res.arrayBuffer())
    }
    if (bytes) files[name] = `data:image/webp;base64,${bytes.toString('base64')}`
  }
  return `window.__avatar3dTextures = ${JSON.stringify(files)};`
}

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
  return `${await textureScript()}\n${result.outputFiles[0].text}`
}

export interface RenderFramesOptions {
  outDir: string
  /** Called every so often with frames done and total. */
  onProgress?: (done: number, total: number, msPerFrame: number) => void
}

async function launchChrome() {
  const { chromium } = await import('playwright-core')
  const software = process.platform === 'linux'
  const extra = process.env.ANIM_CHROME_ARGS?.split(/\s+/).filter(Boolean) ?? []
  return chromium.launch({
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
}

export interface StillJob {
  timeline: AnimationTimeline
  /** Where to write the PNG. */
  out: string
  /** Cast shadows on the floor (default true). Cutouts turn them off and keep the soft blob. */
  shadows?: boolean
}

/**
 * Draws single pictures: each job's timeline is played up to its last frame (so poses and
 * reactions settle) and only that frame is written, as a transparent PNG. One browser serves every
 * job.
 */
export async function renderStills(jobs: StillJob[], onDone?: (job: StillJob, seconds: number) => void): Promise<void> {
  if (!jobs.length) return
  const bundle = await bundlePlayer()
  const browser = await launchChrome()
  try {
    for (const job of jobs) {
      const started = Date.now()
      const { timeline } = job
      const page = await browser.newPage({ viewport: { width: timeline.width, height: timeline.height }, deviceScaleFactor: 1 })
      const errors: string[] = []
      page.on('pageerror', (e) => errors.push(e.message))
      await page.setContent('<!doctype html><html><body style="margin:0;background:transparent"></body></html>')
      await page.addScriptTag({ content: bundle })
      await page.evaluate(([t, shadows]) => window.__anim.setup(t, { shadows }), [timeline, job.shadows ?? true] as const)
      const url = await page.evaluate((index) => window.__anim.frame(index), timeline.frames - 1)
      if (errors.length) throw new Error(`3D stage failed: ${errors.join('; ')}`)
      fs.mkdirSync(path.dirname(job.out), { recursive: true })
      fs.writeFileSync(job.out, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'))
      await page.close()
      onDone?.(job, (Date.now() - started) / 1000)
    }
  } finally {
    await browser.close().catch(() => undefined)
  }
}

/** Renders every frame of the timeline into outDir as 00000.png, 00001.png, ... */
export async function renderFrames(timeline: AnimationTimeline, options: RenderFramesOptions): Promise<{ frames: number; seconds: number }> {
  fs.mkdirSync(options.outDir, { recursive: true })
  const bundle = await bundlePlayer()
  const browser = await launchChrome()
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
