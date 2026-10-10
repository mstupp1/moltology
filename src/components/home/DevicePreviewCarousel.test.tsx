import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DevicePreviewCarousel, PREVIEW_INTERVAL_MS } from './DevicePreviewCarousel'
import { DEVICE_PREVIEW_LIBRARY } from './device-preview-library'

let intersection: (entries: { isIntersecting: boolean }[]) => void
let reduced = false
let motionListener: () => void

beforeEach(() => {
  vi.useFakeTimers()
  reduced = false
  vi.stubGlobal('matchMedia', () => ({
    get matches() { return reduced },
    addEventListener: (_: string, listener: () => void) => { motionListener = listener },
    removeEventListener: vi.fn(),
  }))
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof intersection) { intersection = callback }
    observe() {}
    disconnect() {}
  })
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

function enterViewport() {
  act(() => intersection([{ isIntersecting: true }]))
}
function load(label: string) {
  fireEvent.load(screen.getByAltText(DEVICE_PREVIEW_LIBRARY.find((shot) => shot.label === label)!.alt))
}
function tick() { act(() => vi.advanceTimersByTime(PREVIEW_INTERVAL_MS)) }
function expectActive(label: string) {
  expect(screen.getByRole('button', { name: `Show ${label} screenshot` })).toHaveAttribute('aria-pressed', 'true')
}

describe('DevicePreviewCarousel', () => {
  it('keeps the first paint small and pairs the mobile and desktop sources', () => {
    const { container } = render(<DevicePreviewCarousel />)
    expect(container.querySelectorAll('img')).toHaveLength(1)
    expect(container.querySelector('source')).toHaveAttribute('srcset', expect.stringContaining('dashboard_mobile_preview_sm.webp'))
    expectActive('Dashboard')
  })

  it('recognizes an SSR image that finished loading before hydration', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1280)
    render(<DevicePreviewCarousel />)
    enterViewport()
    load('Community')
    tick()
    expectActive('Community')
    fireEvent.click(screen.getByRole('button', { name: 'Show Dashboard screenshot' }))
    expectActive('Dashboard')
  })

  it('waits for the next capture, cycles through every sector, and wraps around', () => {
    render(<DevicePreviewCarousel />)
    enterViewport()
    load('Dashboard')
    tick()
    expectActive('Dashboard')
    for (const shot of DEVICE_PREVIEW_LIBRARY.slice(1)) {
      load(shot.label)
      tick()
      expectActive(shot.label)
    }
    tick()
    expectActive('Dashboard')
  })

  it('loads a manually selected distant sector before changing and pauses rotation', () => {
    render(<DevicePreviewCarousel />)
    fireEvent.click(screen.getByRole('button', { name: 'Show Codex screenshot' }))
    expectActive('Dashboard')
    load('Codex')
    expectActive('Codex')
    enterViewport()
    load('Dashboard')
    tick()
    expectActive('Codex')
    fireEvent.click(screen.getByRole('button', { name: 'Play screenshot rotation' }))
    tick()
    expectActive('Dashboard')
  })

  it('keeps an in-flight preload mounted when another sector is selected', () => {
    render(<DevicePreviewCarousel />)
    enterViewport()
    const preloadedImage = screen.getByAltText(DEVICE_PREVIEW_LIBRARY[1].alt)
    fireEvent.click(screen.getByRole('button', { name: 'Show Codex screenshot' }))
    load('Codex')
    expectActive('Codex')
    expect(preloadedImage).toBeInTheDocument()
    load('Community')
    fireEvent.click(screen.getByRole('button', { name: 'Show Community screenshot' }))
    expectActive('Community')
  })

  it('pauses on hover, keyboard focus, offscreen, and in a hidden tab', () => {
    render(<DevicePreviewCarousel />)
    enterViewport()
    load('Dashboard')
    load('Community')
    const region = screen.getByRole('region', { name: 'Platform screenshots' })
    fireEvent.mouseEnter(region)
    tick()
    expectActive('Dashboard')
    fireEvent.mouseLeave(region)
    fireEvent.focus(screen.getByRole('button', { name: 'Show Dashboard screenshot' }))
    tick()
    expectActive('Dashboard')
    fireEvent.blur(region, { relatedTarget: null })
    act(() => intersection([{ isIntersecting: false }]))
    tick()
    expectActive('Dashboard')
    enterViewport()
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    fireEvent(document, new Event('visibilitychange'))
    tick()
    expectActive('Dashboard')
    vi.restoreAllMocks()
    fireEvent(document, new Event('visibilitychange'))
    tick()
    expectActive('Community')
  })

  it('respects reduced motion, including a change while the page is open', () => {
    render(<DevicePreviewCarousel />)
    enterViewport()
    load('Community')
    act(() => { reduced = true; motionListener() })
    tick()
    expectActive('Dashboard')
    expect(screen.queryByRole('button', { name: 'Pause screenshot rotation' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show Community screenshot' }))
    expectActive('Community')
  })

  it('skips a failed capture without fading into a blank frame', () => {
    render(<DevicePreviewCarousel />)
    enterViewport()
    fireEvent.error(screen.getByAltText(DEVICE_PREVIEW_LIBRARY[1].alt))
    load('Oracle')
    tick()
    expectActive('Oracle')
  })
})
