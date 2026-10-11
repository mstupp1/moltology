import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import { HeroReel, nextReelIndex } from './StoryPrimitives'
import { STORY_MEDIA } from './content'

function mockMatchMedia(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reduced : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
}

const srcs = (container: HTMLElement) =>
  [...container.querySelectorAll('video')].map((video) => video.getAttribute('src'))

describe('nextReelIndex', () => {
  it('walks forward and loops back to the first clip', () => {
    expect(nextReelIndex(0, 6)).toBe(1)
    expect(nextReelIndex(5, 6)).toBe(0)
    expect(nextReelIndex(0, 0)).toBe(0)
  })
})

describe('HeroReel', () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('plays the full homepage film in order', () => {
    expect(STORY_MEDIA.heroReel.map((clip) => clip.src)).toEqual([
      '/media/videos/hero_benthic_core.mp4',
      '/media/videos/hero_asset_shedding.mp4',
      '/media/videos/hero_chitin_hardening.mp4',
      '/media/videos/hero_total_carcinization.mp4',
      '/media/videos/hero_fault_isolation.mp4',
      '/media/videos/hero_synaptic_path.mp4',
    ])
  })

  it('shows only the first poster for reduced-motion visitors', () => {
    mockMatchMedia(true)
    const { container } = render(<HeroReel clips={STORY_MEDIA.heroReel} />)
    expect(container.querySelectorAll('video')).toHaveLength(0)
    expect(container.querySelector('img')?.getAttribute('src')).toBe(STORY_MEDIA.heroReel[0].poster)
  })

  it('loads one clip, buffers the next once it can play, and advances when it ends', () => {
    vi.useFakeTimers()
    mockMatchMedia(false)
    const { container } = render(<HeroReel clips={STORY_MEDIA.heroReel} />)
    expect(srcs(container)).toEqual(['/media/videos/hero_benthic_core.mp4'])

    act(() => {
      fireEvent.canPlay(container.querySelector('video')!)
    })
    expect(srcs(container)).toEqual(['/media/videos/hero_benthic_core.mp4', '/media/videos/hero_asset_shedding.mp4'])

    act(() => {
      fireEvent.ended(container.querySelector('video')!)
    })
    // The finished clip stays mounted just long enough to crossfade out.
    expect(srcs(container)).toEqual(['/media/videos/hero_benthic_core.mp4', '/media/videos/hero_asset_shedding.mp4'])

    act(() => {
      vi.runAllTimers()
    })
    expect(srcs(container)).toEqual(['/media/videos/hero_asset_shedding.mp4'])
  })
})
