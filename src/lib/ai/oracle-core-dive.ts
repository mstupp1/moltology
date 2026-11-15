/**
 * Motion for the Oracle chat's core view toggle ("dive in"): the core opens out of
 * the small core button in the chat header as a growing circle, and shrinks back into
 * it on the way out. (The phone bottom-bar orb's drain is CSS on OracleCoreGlyph.)
 *
 * Everything here is one Web Animations call on transform, opacity or clip-path, so
 * there is no per-frame script. Under prefers-reduced-motion, or where element.animate
 * is missing (tests, old browsers), callers fall back to an instant swap.
 */

export const CORE_DIVE_IN_MS = 560
export const CORE_DIVE_OUT_MS = 420
/** The chat view fades this long before the core opens, and after it closes. */
export const CORE_CHAT_FADE_MS = 140

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** True when the dive should play: animations exist and motion is welcome. */
export function canPlayCoreMotion(el: Element | null | undefined): el is HTMLElement {
  return Boolean(el && typeof (el as HTMLElement).animate === 'function' && !prefersReducedMotion())
}

function circleOrigin(layer: HTMLElement, origin: Element | null) {
  const box = layer.getBoundingClientRect()
  const from = origin?.getBoundingClientRect()
  const x = from ? from.left + from.width / 2 - box.left : box.width - 40
  const y = from ? from.top + from.height / 2 - box.top : 0
  // Far enough to cover the farthest corner from the origin.
  const r = Math.hypot(Math.max(x, box.width - x), Math.max(y, box.height - y)) + 8
  return { x, y, r }
}

const settle = (animation: Animation) => animation.finished.then(() => undefined, () => undefined)

/** Opens the core layer as a circle growing out of the origin button. */
export function diveIntoCore(layer: HTMLElement, origin: Element | null): Promise<void> {
  if (!canPlayCoreMotion(layer)) return Promise.resolve()
  const { x, y, r } = circleOrigin(layer, origin)
  return settle(
    layer.animate(
      [{ clipPath: `circle(12px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }],
      { duration: CORE_DIVE_IN_MS, easing: 'cubic-bezier(0.3, 0.6, 0.2, 1)' },
    ),
  )
}

/** Shrinks the core layer back into the origin button. Stays shut until the caller swaps views. */
export function surfaceFromCore(layer: HTMLElement, origin: Element | null): Promise<void> {
  if (!canPlayCoreMotion(layer)) return Promise.resolve()
  const { x, y, r } = circleOrigin(layer, origin)
  return settle(
    layer.animate(
      [{ clipPath: `circle(${r}px at ${x}px ${y}px)` }, { clipPath: `circle(0px at ${x}px ${y}px)`, opacity: 0.6 }],
      { duration: CORE_DIVE_OUT_MS, easing: 'cubic-bezier(0.6, 0, 0.7, 0.4)', fill: 'forwards' },
    ),
  )
}

export function fadeOutChat(el: Element | null): Promise<void> {
  if (!canPlayCoreMotion(el)) return Promise.resolve()
  return settle(
    el.animate([{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.97)' }], {
      duration: CORE_CHAT_FADE_MS,
      easing: 'ease-in',
      fill: 'forwards',
    }),
  )
}

export function fadeInChat(el: Element | null): void {
  if (!canPlayCoreMotion(el)) return
  el.animate([{ opacity: 0, transform: 'scale(0.97)' }, { opacity: 1, transform: 'scale(1)' }], {
    duration: 240,
    easing: 'ease-out',
  })
}
