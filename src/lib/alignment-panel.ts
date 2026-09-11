/** Custom event that opens the in-HUD Daily Alignment liturgies panel (NEXT chip). */
export const OPEN_ALIGNMENT_PANEL_EVENT = 'open-alignment-panel'

/** Fire from dashboard chrome so HUDTaskBar opens the same liturgies panel as NEXT. */
export function openAlignmentPanel(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(OPEN_ALIGNMENT_PANEL_EVENT))
}

/**
 * Header HUDTaskBar mounts in both the desktop top bar and the mobile rail.
 * Only the visible host should open so a hidden instance does not portal a second sheet.
 */
export function isAlignmentPanelHostVisible(el: HTMLElement | null): boolean {
  if (!el) return false

  let node: HTMLElement | null = el
  while (node) {
    const style = window.getComputedStyle(node)
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false
    }
    node = node.parentElement
  }

  return true
}
