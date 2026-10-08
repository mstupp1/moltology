import { useEffect } from 'react'

export const COMPOSITE_READY_ATTR = 'data-composite-ready'

const MAX_WAIT_MS = 12000

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function waitForImages(root: ParentNode): Promise<unknown> {
  const images = Array.from(root.querySelectorAll('img'))
  return Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return img.decode?.().catch(() => undefined)
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    })
  )
}

async function waitForFits(root: ParentNode, deadline: number): Promise<void> {
  while (root.querySelector('[data-fit="pending"]') && Date.now() < deadline) {
    await nextFrame()
  }
}

/**
 * Raw composite mode only. Marks <html data-composite-ready="true"> once web fonts, every
 * image and every auto-fit text box have settled, so the headless capture shoots the final
 * frame instead of guessing with a fixed delay. Missing images are listed in
 * data-composite-missing so the capture can report them.
 */
export function useCompositeReady(enabled: boolean, renderKey: string) {
  useEffect(() => {
    if (!enabled) return
    const html = document.documentElement
    html.setAttribute(COMPOSITE_READY_ATTR, 'false')
    let cancelled = false
    const deadline = Date.now() + MAX_WAIT_MS

    const run = async () => {
      await document.fonts?.ready
      // Two passes: images can mount after the first fonts/fit pass (mascot fallbacks).
      for (let pass = 0; pass < 2; pass++) {
        await nextFrame()
        await Promise.race([waitForImages(document), new Promise((r) => setTimeout(r, Math.max(0, deadline - Date.now())))])
        await waitForFits(document, deadline)
      }
      await nextFrame()
      await nextFrame()
      if (cancelled) return
      const missing = Array.from(document.querySelectorAll('img'))
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.currentSrc || img.src)
      if (missing.length > 0) html.setAttribute('data-composite-missing', JSON.stringify(missing))
      else html.removeAttribute('data-composite-missing')
      html.setAttribute(COMPOSITE_READY_ATTR, 'true')
    }
    run()

    return () => {
      cancelled = true
    }
  }, [enabled, renderKey])
}
