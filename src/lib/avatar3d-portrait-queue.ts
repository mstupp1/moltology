/**
 * Asks for 3D stills (avatars, creator option cards, gear icons) without pulling the 3D renderer
 * into every page. Each still is kept in the browser between visits, so a returning member sees
 * pictures at once and a page of known faces never downloads the renderer at all. New stills are
 * drawn one at a time between frames, so a long list fills in without freezing the page.
 */
import { mark3DUnavailable } from './avatar3d-support'
import { canonical, shortHash, STILL_VERSION, storedStillUrl } from './avatar-still'
import type { LobsterAvatarConfig } from './lobster-avatar'
import type { StillShot } from './avatar3d/portraits'

export type { StillShot }

export { STILL_VERSION }
const STORE = `avatar3d-stills-v${STILL_VERSION}`
/** Stills kept between visits. Each is a few kilobytes. */
const KEEP = 800

interface Job {
  key: string
  config: LobsterAvatarConfig
  px: number
  shot: StillShot
  resolve: (url: string | null) => void
  /** How many on-screen pictures still want this one; at 0 it is dropped before it is drawn. */
  wanted: number
}

const queue: Job[] = []
const pending = new Map<string, Promise<string | null>>()
const ready = new Map<string, string>()
let running = false
let writes = 0

/** Same character, same picture: the key ignores field order and anything a still cannot show. */
function stillKeyOf(config: LobsterAvatarConfig, px: number, shot: StillShot): string {
  const { backgroundTheme: _t, backgroundPattern: _p, backgroundTexture: _x, temperament: _i, still: _s, ...rest } = config as LobsterAvatarConfig & Record<string, unknown>
  const look = shot === 'portrait' ? { ...rest, pose: undefined } : rest
  return `${shot}|${px}|${canonical(look)}`
}

function storeUrl(key: string): string {
  return `${location.origin}/__avatar3d-still/${shortHash(key)}`
}

async function openStore(): Promise<Cache | null> {
  try {
    return typeof caches === 'undefined' ? null : await caches.open(STORE)
  } catch {
    return null
  }
}

async function readKept(key: string): Promise<string | null> {
  const store = await openStore()
  const hit = await store?.match(storeUrl(key)).catch(() => undefined)
  return hit ? hit.text().catch(() => null) : null
}

async function keep(key: string, url: string): Promise<void> {
  const store = await openStore()
  if (!store) return
  try {
    await store.put(storeUrl(key), new Response(url, { headers: { 'content-type': 'text/plain' } }))
    // Now and then, drop the oldest stills so the store stays small.
    if (++writes % 40 === 0) {
      const keys = await store.keys()
      for (const old of keys.slice(0, Math.max(0, keys.length - KEEP))) await store.delete(old)
    }
  } catch {
    // Storage full or blocked: the still just is not kept.
  }
}

/** Wait for the browser to have a spare moment, so scrolling and typing stay smooth. */
function breathe(): Promise<void> {
  return new Promise((next) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(() => next(), { timeout: 120 })
    else setTimeout(next, 16)
  })
}

async function run(): Promise<void> {
  running = true
  try {
    const { Avatar3DUnavailable, lookFromConfig, renderStill } = await import('./avatar3d')
    while (queue.length) {
      const job = queue.shift()!
      if (job.wanted <= 0) {
        job.resolve(null)
        continue
      }
      try {
        const url = renderStill(lookFromConfig(job.config), job.px, job.shot)
        job.resolve(url)
        void keep(job.key, url)
      } catch (error) {
        // If 3D would not start at all, every picture falls back to its placeholder.
        if (error instanceof Avatar3DUnavailable) mark3DUnavailable()
        job.resolve(null)
      }
      await breathe()
    }
  } catch {
    for (const job of queue.splice(0)) job.resolve(null)
  } finally {
    running = false
  }
}

/** A still drawn this visit, ready to show on the first render. */
export function readyStill3D(config: LobsterAvatarConfig, px: number, shot: StillShot = 'portrait'): string | null {
  return savedPortrait(config, shot) ?? ready.get(stillKeyOf(config, px, shot)) ?? null
}

const broken = new Set<string>()

/** The member's stored portrait image, when one was saved for exactly this look. */
function savedPortrait(config: LobsterAvatarConfig, shot: StillShot): string | null {
  if (shot !== 'portrait') return null
  const url = storedStillUrl(config)
  return url && !broken.has(url) ? url : null
}

/** A stored portrait would not load: stop offering it, so the character is drawn here instead. */
export function forgetStoredStill(url: string): void {
  broken.add(url)
}

const interest = new Map<string, number>()

/**
 * A 3D still of this character, or null when 3D is not available. Pass a signal to say the
 * picture is no longer wanted (it scrolled away, or the character changed): a still nobody wants
 * any more is skipped instead of drawn, so quick edits never queue up stale pictures.
 */
export function requestStill3D(config: LobsterAvatarConfig, px: number, shot: StillShot = 'portrait', signal?: AbortSignal): Promise<string | null> {
  const saved = savedPortrait(config, shot)
  if (saved) return Promise.resolve(saved)
  const key = stillKeyOf(config, px, shot)
  const done = ready.get(key)
  if (done) return Promise.resolve(done)
  interest.set(key, (interest.get(key) ?? 0) + 1)
  const queued = queue.find((j) => j.key === key)
  if (queued) queued.wanted = interest.get(key)!
  signal?.addEventListener('abort', () => {
    if (!interest.has(key)) return
    const left = interest.get(key)! - 1
    interest.set(key, left)
    const job = queue.find((j) => j.key === key)
    if (job) job.wanted = left
  }, { once: true })
  const waiting = pending.get(key)
  if (waiting) return waiting
  const promise = (async () => {
    const kept = await readKept(key)
    const url =
      kept ??
      (await new Promise<string | null>((resolve) => {
        queue.push({ key, config, px, shot, resolve, wanted: interest.get(key) ?? 1 })
        if (!running) void run()
      }))
    pending.delete(key)
    interest.delete(key)
    if (url) {
      ready.set(key, url)
      if (ready.size > 400) ready.delete(ready.keys().next().value as string)
    }
    return url
  })()
  pending.set(key, promise)
  return promise
}

/** A head-and-shoulders still of this character in 3D, or null when 3D is not available. */
export function requestPortrait3D(config: LobsterAvatarConfig, px: number): Promise<string | null> {
  return requestStill3D(config, px, 'portrait')
}

export function resetStillsForTests(): void {
  queue.length = 0
  pending.clear()
  interest.clear()
  ready.clear()
  broken.clear()
}
