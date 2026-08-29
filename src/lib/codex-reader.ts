/** Canonical paper width for the Sacred Codex reading sheet, in CSS pixels. */
export const CODEX_PAGE_WIDTH = 720
export const CODEX_PAGE_MIN_WIDTH = 300
export const CODEX_MOBILE_GUTTER = 20
export const CODEX_DESKTOP_GUTTER = 96
export const CODEX_COMPACT_BREAKPOINT = 768

export const CODEX_ZOOM_MIN = 0.5
export const CODEX_ZOOM_MAX = 3
export const CODEX_ZOOM_STEP = 0.15
export const CODEX_ZOOM_DOUBLE_TAP = 1.75

export function clampCodexZoom(zoom: number): number {
  const clamped = Math.min(CODEX_ZOOM_MAX, Math.max(CODEX_ZOOM_MIN, zoom))
  return Math.round(clamped * 100) / 100
}

export function stepCodexZoom(zoom: number, direction: 1 | -1): number {
  return clampCodexZoom(zoom + direction * CODEX_ZOOM_STEP)
}

export function formatCodexZoom(zoom: number): string {
  return `${Math.round(zoom * 100)}%`
}

export function isCompactCodexViewport(viewportWidth: number): boolean {
  return viewportWidth < CODEX_COMPACT_BREAKPOINT
}

export function resolveCodexPageWidth(viewportWidth: number): number {
  const compact = isCompactCodexViewport(viewportWidth)
  const gutter = compact ? CODEX_MOBILE_GUTTER : CODEX_DESKTOP_GUTTER
  return Math.max(
    CODEX_PAGE_MIN_WIDTH,
    Math.min(CODEX_PAGE_WIDTH, viewportWidth - gutter)
  )
}

export function scaledCodexBox(width: number, height: number, zoom: number): {
  width: number
  height: number
} {
  return {
    width: Math.max(0, width * zoom),
    height: Math.max(0, height * zoom),
  }
}

export function nextScrollAfterZoom(args: {
  scrollLeft: number
  scrollTop: number
  originX: number
  originY: number
  viewportLeft: number
  viewportTop: number
  oldZoom: number
  newZoom: number
}): { scrollLeft: number; scrollTop: number } {
  const { oldZoom, newZoom } = args
  if (oldZoom <= 0 || newZoom <= 0 || oldZoom === newZoom) {
    return { scrollLeft: args.scrollLeft, scrollTop: args.scrollTop }
  }

  const ratio = newZoom / oldZoom
  const localX = args.originX - args.viewportLeft + args.scrollLeft
  const localY = args.originY - args.viewportTop + args.scrollTop

  return {
    scrollLeft: localX * ratio - (args.originX - args.viewportLeft),
    scrollTop: localY * ratio - (args.originY - args.viewportTop),
  }
}

export function applyZoomScroll(viewport: HTMLElement, oldZoom: number, newZoom: number, originX: number, originY: number) {
  const rect = viewport.getBoundingClientRect()
  const next = nextScrollAfterZoom({
    scrollLeft: viewport.scrollLeft,
    scrollTop: viewport.scrollTop,
    originX,
    originY,
    viewportLeft: rect.left,
    viewportTop: rect.top,
    oldZoom,
    newZoom,
  })
  viewport.scrollLeft = next.scrollLeft
  viewport.scrollTop = next.scrollTop
}

export function touchDistance(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

export function toggleDoubleTapZoom(zoom: number): number {
  return zoom > 1.2 ? 1 : CODEX_ZOOM_DOUBLE_TAP
}
