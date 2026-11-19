import { useEffect, type RefObject } from 'react'

/** Space kept between a title row's last action and the floating pill. */
const PILL_GAP = 12

/**
 * The desktop search pill floats over the page panel's top-right corner. Title rows keep a
 * `.hud-pill-clear` spacer so their actions stop short of it, but only as wide as the pill
 * actually reaches into the panel: on wide screens the pill sits in the gutter and the spacer
 * collapses, so actions sit flush right. Writes `--hud-pill-clear` and `data-pill-clear` on the
 * panel and keeps them current as the window, rail or pill change size.
 */
export function usePillClearance(panelRef: RefObject<HTMLElement | null>, enabled: boolean) {
  useEffect(() => {
    const panel = panelRef.current
    if (!enabled || !panel || typeof ResizeObserver === 'undefined') return
    const pill = document.getElementById('hud-top-controls-slot')
    let frame = 0
    const measure = () => {
      frame = 0
      const pillBox = pill?.getBoundingClientRect()
      if (!pillBox || pillBox.width === 0) {
        panel.style.setProperty('--hud-pill-clear', '0px')
        panel.dataset.pillClear = 'none'
        return
      }
      const styles = getComputedStyle(panel)
      const contentRight =
        panel.getBoundingClientRect().right -
        parseFloat(styles.borderRightWidth || '0') -
        parseFloat(styles.paddingRight || '0')
      const clear = Math.max(0, Math.ceil(contentRight - pillBox.left + PILL_GAP))
      panel.style.setProperty('--hud-pill-clear', `${clear}px`)
      panel.dataset.pillClear = clear > 0 ? 'some' : 'none'
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    const observer = new ResizeObserver(schedule)
    observer.observe(panel)
    if (pill) observer.observe(pill)
    window.addEventListener('resize', schedule)
    measure()
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [panelRef, enabled])
}
