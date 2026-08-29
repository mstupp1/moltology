import { describe, expect, it } from 'vitest'
import {
  CODEX_PAGE_WIDTH,
  CODEX_ZOOM_DOUBLE_TAP,
  CODEX_ZOOM_MAX,
  CODEX_ZOOM_MIN,
  applyZoomScroll,
  clampCodexZoom,
  formatCodexZoom,
  isCompactCodexViewport,
  nextScrollAfterZoom,
  resolveCodexPageWidth,
  scaledCodexBox,
  stepCodexZoom,
  toggleDoubleTapZoom,
  touchDistance,
} from './codex-reader'

describe('codex-reader zoom geometry', () => {
  it('clamps zoom to the readable PDF range', () => {
    expect(clampCodexZoom(0.1)).toBe(CODEX_ZOOM_MIN)
    expect(clampCodexZoom(9)).toBe(CODEX_ZOOM_MAX)
    expect(clampCodexZoom(1.234)).toBe(1.23)
  })

  it('steps zoom without leaving the clamp window', () => {
    expect(stepCodexZoom(1, 1)).toBe(1.15)
    expect(stepCodexZoom(CODEX_ZOOM_MIN, -1)).toBe(CODEX_ZOOM_MIN)
    expect(stepCodexZoom(CODEX_ZOOM_MAX, 1)).toBe(CODEX_ZOOM_MAX)
  })

  it('formats zoom as a percentage label', () => {
    expect(formatCodexZoom(1)).toBe('100%')
    expect(formatCodexZoom(1.5)).toBe('150%')
    expect(formatCodexZoom(0.54)).toBe('54%')
  })

  it('sizes the paper to a comfortable column instead of stretching full viewport', () => {
    expect(isCompactCodexViewport(390)).toBe(true)
    expect(isCompactCodexViewport(1280)).toBe(false)
    expect(resolveCodexPageWidth(390)).toBe(370)
    expect(resolveCodexPageWidth(1280)).toBe(CODEX_PAGE_WIDTH)
    expect(resolveCodexPageWidth(200)).toBe(300)
  })

  it('scales the page box like a PDF sheet', () => {
    expect(scaledCodexBox(720, 1000, 1.5)).toEqual({ width: 1080, height: 1500 })
    expect(scaledCodexBox(720, 1000, 0.5)).toEqual({ width: 360, height: 500 })
  })

  it('keeps the focal point stable when zooming like a PDF viewer', () => {
    const next = nextScrollAfterZoom({
      scrollLeft: 100,
      scrollTop: 200,
      originX: 400,
      originY: 300,
      viewportLeft: 0,
      viewportTop: 0,
      oldZoom: 1,
      newZoom: 2,
    })

    expect(next.scrollLeft).toBe(600)
    expect(next.scrollTop).toBe(700)
  })

  it('applies focal zoom to a viewport element', () => {
    const viewport = {
      scrollLeft: 40,
      scrollTop: 80,
      getBoundingClientRect: () => ({ left: 10, top: 20, width: 400, height: 600 }),
    } as HTMLElement

    applyZoomScroll(viewport, 1, 2, 110, 120)

    expect(viewport.scrollLeft).toBe(180)
    expect(viewport.scrollTop).toBe(260)
  })

  it('measures pinch distance and toggles double-tap zoom', () => {
    expect(touchDistance({ clientX: 0, clientY: 0 }, { clientX: 3, clientY: 4 })).toBe(5)
    expect(toggleDoubleTapZoom(1)).toBe(CODEX_ZOOM_DOUBLE_TAP)
    expect(toggleDoubleTapZoom(1.8)).toBe(1)
  })
})
