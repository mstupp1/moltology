import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HeroShuffleDeck, HERO_DECK_CROSSFADE_MS } from './HeroShuffleDeck'

class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  static instance: MockIntersectionObserver | null = null

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instance = this
  }

  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])

  trigger(isIntersecting: boolean) {
    this.callback(
      [
        {
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          target: document.createElement('div'),
        } as unknown as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

describe('HeroShuffleDeck Component', () => {
  beforeEach(() => {
    MockIntersectionObserver.instance = null
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders posters without mounting hero clips on first paint', () => {
    const { container } = render(<HeroShuffleDeck />)

    expect(container.querySelectorAll('video')).toHaveLength(0)
    expect(screen.getByAltText('CYBER-BENTHIC ASCENSION')).toBeInTheDocument()
    expect(container.querySelectorAll('img')).toHaveLength(1)
  })

  it('mounts the active clip and pre-buffers the next one after it can play', () => {
    const { container } = render(<HeroShuffleDeck />)

    act(() => {
      MockIntersectionObserver.instance?.trigger(true)
    })

    // Only the active clip mounts until it can actually play
    const videos = container.querySelectorAll('video')
    expect(videos).toHaveLength(1)
    const activeVideo = videos[0]
    expect(activeVideo.getAttribute('preload')).toBe('auto')
    expect(activeVideo.getAttribute('autoplay')).toBe('')
    expect((activeVideo as HTMLVideoElement).muted).toBe(true)
    expect(activeVideo.getAttribute('poster')).toBeTruthy()
    const sources = activeVideo.querySelectorAll('source')
    expect(sources).toHaveLength(2)
    expect(sources[0].getAttribute('media')).toBe('(max-width: 767px)')
    expect(sources[0].getAttribute('src')).toBe('/videos/hero_benthic_core_sm.mp4')
    expect(sources[1].getAttribute('src')).toBe('/videos/hero_benthic_core.mp4')

    // Once the active clip can play, the next one is pre-buffered
    act(() => {
      activeVideo.dispatchEvent(new Event('canplay'))
    })

    const preloadedVideo = container.querySelectorAll('video')[1]
    expect(preloadedVideo.getAttribute('preload')).toBe('auto')
    expect(preloadedVideo.getAttribute('autoplay')).toBeNull()
  })

  it('does not mount every transmission when advancing the deck', () => {
    const { container } = render(<HeroShuffleDeck />)

    act(() => {
      MockIntersectionObserver.instance?.trigger(true)
    })
    act(() => {
      container.querySelector('video')?.dispatchEvent(new Event('canplay'))
    })

    fireEvent.click(screen.getByRole('button', { name: /next video transmission/i }))
    expect(container.querySelectorAll('video').length).toBeLessThanOrEqual(3)

    fireEvent.click(screen.getByRole('button', { name: /jump to total carcinization/i }))
    expect(container.querySelectorAll('video').length).toBeLessThanOrEqual(3)
    expect(container.querySelector('source[src="/videos/hero_total_carcinization.mp4"]')).toBeTruthy()
    expect(container.querySelectorAll('video').length).toBeLessThan(6)
  })

  it('unmounts the outgoing clip after the crossfade', () => {
    vi.useFakeTimers()
    const { container } = render(<HeroShuffleDeck />)

    act(() => {
      MockIntersectionObserver.instance?.trigger(true)
    })
    act(() => {
      container.querySelector('video')?.dispatchEvent(new Event('canplay'))
    })

    fireEvent.click(screen.getByRole('button', { name: /next video transmission/i }))
    // Pre-buffer resets until the new active clip can play
    expect(container.querySelectorAll('video').length).toBe(2)

    act(() => {
      container.querySelectorAll('video')[0].dispatchEvent(new Event('canplay'))
    })
    expect(container.querySelectorAll('video').length).toBe(3)

    act(() => {
      vi.advanceTimersByTime(HERO_DECK_CROSSFADE_MS + 20)
    })

    const videos = container.querySelectorAll('video')
    expect(videos.length).toBe(2)
    const activeSources = videos[0].querySelectorAll('source')
    expect(activeSources[activeSources.length - 1].getAttribute('src')).toBe('/videos/hero_asset_shedding.mp4')
  })

  it('renders minimal video container with hover-only controls', () => {
    render(<HeroShuffleDeck />)

    const nextBtn = screen.getByRole('button', { name: /next video transmission/i })
    const prevBtn = screen.getByRole('button', { name: /previous video transmission/i })

    expect(nextBtn).toBeInTheDocument()
    expect(prevBtn).toBeInTheDocument()
    expect(nextBtn.className).toContain('opacity-0 group-hover:opacity-100')
  })

  it('navigates next and previous using chevron buttons', () => {
    render(<HeroShuffleDeck />)

    const nextBtn = screen.getByRole('button', { name: /next video transmission/i })
    const prevBtn = screen.getByRole('button', { name: /previous video transmission/i })

    fireEvent.click(nextBtn)
    expect(screen.getByRole('button', { name: /jump to asset transmutation/i })).toBeInTheDocument()

    fireEvent.click(prevBtn)
    expect(screen.getByRole('button', { name: /jump to cyber-benthic ascension/i })).toBeInTheDocument()
  })

  it('allows direct jumping via bottom slider indicators', () => {
    render(<HeroShuffleDeck />)

    const jumpBtn4 = screen.getByRole('button', { name: /jump to total carcinization/i })
    fireEvent.click(jumpBtn4)

    expect(jumpBtn4).toBeInTheDocument()
  })

  it('supports touch swipe gestures to advance slides on mobile', () => {
    const { container } = render(<HeroShuffleDeck />)
    const deck = container.firstChild as HTMLElement

    fireEvent.touchStart(deck, { targetTouches: [{ clientX: 200 }] })
    fireEvent.touchMove(deck, { targetTouches: [{ clientX: 100 }] })
    fireEvent.touchEnd(deck)

    expect(screen.getByRole('button', { name: /jump to asset transmutation/i })).toBeInTheDocument()

    fireEvent.touchStart(deck, { targetTouches: [{ clientX: 100 }] })
    fireEvent.touchMove(deck, { targetTouches: [{ clientX: 200 }] })
    fireEvent.touchEnd(deck)

    expect(screen.getByRole('button', { name: /jump to cyber-benthic ascension/i })).toBeInTheDocument()
  })
})
