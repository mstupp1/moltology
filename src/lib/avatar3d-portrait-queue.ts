/**
 * Asks for 3D portrait stills without pulling the 3D renderer into every page. The renderer
 * loads on the first request, and faces are drawn one at a time between frames so a long list
 * fills in without freezing the page.
 */
import { mark3DUnavailable } from './avatar3d-support'
import type { LobsterAvatarConfig } from './lobster-avatar'

interface Job {
  config: LobsterAvatarConfig
  px: number
  resolve: (url: string | null) => void
}

const queue: Job[] = []
let running = false

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
    const { Avatar3DUnavailable, lookFromConfig, renderPortrait } = await import('./avatar3d')
    while (queue.length) {
      const job = queue.shift()!
      try {
        job.resolve(renderPortrait(lookFromConfig(job.config), job.px))
      } catch (error) {
        // The caller keeps its 2D portrait. If 3D would not start at all, so does everything else.
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

/** A head-and-shoulders still of this character in 3D, or null when 3D is not available. */
export function requestPortrait3D(config: LobsterAvatarConfig, px: number): Promise<string | null> {
  return new Promise((resolve) => {
    queue.push({ config, px, resolve })
    if (!running) void run()
  })
}
