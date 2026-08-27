export interface TooltipAnchor {
  top: number
  left: number
  right: number
  bottom: number
}

export type GearHoverTarget = {
  itemId: string
  anchor: TooltipAnchor
}

const GAP = 12
const VIEWPORT_PAD = 8

export function anchorFromElement(el: HTMLElement): TooltipAnchor {
  const rect = el.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
  }
}

export function computeGearTooltipPosition(
  anchor: TooltipAnchor,
  tooltip: { width: number; height: number },
  viewport: { width: number; height: number }
): { top: number; left: number } {
  const { width: tw, height: th } = tooltip
  const { width: vw, height: vh } = viewport

  let left = anchor.right + GAP
  if (left + tw > vw - VIEWPORT_PAD) {
    left = anchor.left - tw - GAP
  }
  left = Math.max(VIEWPORT_PAD, Math.min(left, vw - tw - VIEWPORT_PAD))

  let top = anchor.top
  if (top + th > vh - VIEWPORT_PAD) {
    top = vh - th - VIEWPORT_PAD
  }
  top = Math.max(VIEWPORT_PAD, top)

  return { top, left }
}
