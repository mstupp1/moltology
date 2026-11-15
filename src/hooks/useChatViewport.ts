import { useEffect, useState, type RefObject } from 'react'

/** Phone widths, matching Tailwind's `sm` breakpoint (640px). */
export const PHONE_MEDIA_QUERY = '(max-width: 639px)'

/** Smallest gap that counts as an on-screen keyboard rather than browser chrome resizing. */
export const KEYBOARD_MIN_INSET = 80

/**
 * How much of the layout viewport's bottom edge the on-screen keyboard covers.
 * iOS Safari keeps the layout viewport full height and shrinks (and pans) only the
 * visual viewport, so a bottom-docked box ends up behind the keyboard without this.
 */
export function computeKeyboardInset(layoutHeight: number, visualHeight: number, visualOffsetTop: number): number {
  const covered = Math.round(layoutHeight - visualHeight - visualOffsetTop)
  return covered >= KEYBOARD_MIN_INSET ? covered : 0
}

/**
 * The part of a keyboard inset that actually overlaps a panel ending `gapBelow` px above the
 * layout viewport's bottom (the phone Oracle overlay stops above the bottom tab bar, so the
 * keyboard covers that bar first and only the rest needs padding).
 */
export function panelKeyboardInset(viewportInset: number, gapBelow: number): number {
  if (viewportInset <= 0) return 0
  return Math.max(0, Math.round(viewportInset - Math.max(0, gapBelow)))
}

/** True on phone-width screens. False during SSR and until mounted. */
export function useIsPhone(): boolean {
  const [isPhone, setIsPhone] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(PHONE_MEDIA_QUERY)
    const sync = () => setIsPhone(media.matches)
    sync()
    media.addEventListener?.('change', sync)
    return () => media.removeEventListener?.('change', sync)
  }, [])
  return isPhone
}

/**
 * Tracks the keyboard's bottom inset while `enabled`, measured against `panelRef` when given. Callers pad their bottom edge by it so
 * a docked prompt box sits right on top of the keyboard, and the page is scrolled back so
 * the keyboard opening never slides the whole window up.
 */
export function useKeyboardInset(enabled: boolean, panelRef?: RefObject<HTMLElement | null>): number {
  const [inset, setInset] = useState(0)

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.visualViewport) {
      setInset(0)
      return
    }
    const vv = window.visualViewport
    let frame: number | null = null

    const sync = () => {
      frame = null
      const viewportInset = computeKeyboardInset(window.innerHeight, vv.height, vv.offsetTop)
      // Measure the panel itself so anything below it (the phone tab bar) isn't counted twice.
      const panel = panelRef?.current
      const gapBelow = panel ? window.innerHeight - panel.getBoundingClientRect().bottom : 0
      const next = panelKeyboardInset(viewportInset, gapBelow)
      setInset((prev) => (prev === next ? prev : next))
      // Undo Safari's pan so the chat header stays in view; the inset already lifts the box.
      if (next > 0 && (vv.offsetTop > 0 || window.scrollY > 0)) {
        window.scrollTo(0, 0)
      }
    }
    const schedule = () => {
      if (frame == null) frame = requestAnimationFrame(sync)
    }

    sync()
    vv.addEventListener('resize', schedule)
    vv.addEventListener('scroll', schedule)
    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      vv.removeEventListener('resize', schedule)
      vv.removeEventListener('scroll', schedule)
    }
  }, [enabled, panelRef])

  return inset
}
