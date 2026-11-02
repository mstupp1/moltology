import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Native swipe/keyboard scrolling with fades only toward content outside the viewport. */
export const HorizontalScroll = forwardRef<HTMLElement, HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'nav' | 'ul'
}>(function HorizontalScroll({ as = 'div', className, tabIndex = 0, ...props }, forwardedRef) {
  const ref = useRef<HTMLElement>(null)
  useImperativeHandle(forwardedRef, () => ref.current!, [])

  useEffect(() => {
    const row = ref.current
    if (!row) return
    const update = () => {
      const scrollable = ['auto', 'scroll'].includes(getComputedStyle(row).overflowX)
      const max = scrollable ? Math.max(0, row.scrollWidth - row.clientWidth) : 0
      const rtl = getComputedStyle(row).direction === 'rtl'
      const offset = Math.max(0, Math.min(max, rtl ? -row.scrollLeft : row.scrollLeft))
      row.dataset.fadeLeft = String(rtl ? max - offset > 1 : offset > 1)
      row.dataset.fadeRight = String(rtl ? offset > 1 : max - offset > 1)
    }
    const resize = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update)
    const observeContent = () => {
      resize?.disconnect()
      resize?.observe(row)
      for (const child of row.children) resize?.observe(child)
      update()
    }
    const mutation = new MutationObserver(observeContent)
    mutation.observe(row, { childList: true, subtree: true, characterData: true })
    row.addEventListener('scroll', update, { passive: true })
    row.addEventListener('load', update, true)
    window.addEventListener('resize', update)
    observeContent()
    return () => {
      resize?.disconnect()
      mutation.disconnect()
      row.removeEventListener('scroll', update)
      row.removeEventListener('load', update, true)
      window.removeEventListener('resize', update)
    }
  }, [])

  return createElement(as, {
    ...props,
    ref,
    tabIndex,
    className: cn('horizontal-scroll min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-cyan-glow', className),
  })
})
