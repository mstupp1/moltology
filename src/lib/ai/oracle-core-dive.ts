/**
 * Motion for the Oracle chat's core view toggle ("dive in"): the core opens out of
 * the small core button in the chat header as a growing circle, and shrinks back into
 * it on the way out. On phones the bottom-bar orb's spark travels up into the core
 * and back (the drain itself is CSS on OracleCoreGlyph).
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

/**
 * A spark that carries the bottom-bar orb up into the chat's core, or back down.
 * Appended to body (the bar sits inside transformed parents) and removed when done.
 */
export function playCoreSpark(orb: Element, direction: 'up' | 'down'): void {
  if (typeof document === 'undefined' || prefersReducedMotion()) return
  const spark = document.createElement('span')
  if (typeof spark.animate !== 'function') return
  const from = orb.getBoundingClientRect()
  const start = { x: from.left + from.width / 2, y: from.top + from.height / 2 }
  // The phone core sits in the middle of the open space above the chat's lower controls.
  const space = document.querySelector('[data-testid="synaptic-core-space"]')?.getBoundingClientRect()
  const end =
    // Skip the measured spot while the overlay is still sliding up from below.
    space && space.height > 0 && space.top + space.height / 2 < window.innerHeight * 0.6
      ? { x: space.left + space.width / 2, y: space.top + space.height / 2 }
      : { x: window.innerWidth / 2, y: window.innerHeight * 0.36 }
  const [a, b] = direction === 'up' ? [start, end] : [end, start]
  spark.className = 'oracle-core-spark'
  spark.setAttribute('aria-hidden', 'true')
  document.body.appendChild(spark)
  const frames =
    direction === 'up'
      ? [
          { transform: `translate(${a.x}px, ${a.y}px) scale(0.6)`, opacity: 0 },
          { transform: `translate(${a.x}px, ${a.y - 28}px) scale(1)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(1.8)`, opacity: 0.9, offset: 0.88 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(3)`, opacity: 0 },
        ]
      : [
          { transform: `translate(${a.x}px, ${a.y}px) scale(2)`, opacity: 0 },
          { transform: `translate(${a.x}px, ${a.y}px) scale(1.4)`, opacity: 1, offset: 0.15 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(0.8)`, opacity: 1, offset: 0.85 },
          { transform: `translate(${b.x}px, ${b.y}px) scale(0.4)`, opacity: 0 },
        ]
  const animation = spark.animate(frames, {
    duration: direction === 'up' ? 640 : 560,
    delay: direction === 'up' ? 160 : 0,
    easing: direction === 'up' ? 'cubic-bezier(0.3, 0.1, 0.3, 1)' : 'cubic-bezier(0.5, 0, 0.6, 1)',
    fill: 'backwards',
  })
  const remove = () => spark.remove()
  animation.finished.then(remove, remove)
}
