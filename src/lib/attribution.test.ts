import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ATTRIBUTION_STORAGE_KEY,
  ATTRIBUTION_TTL_MS,
  captureAttribution,
  formatAttribution,
  isFresh,
  leadReferrer,
  parseAttribution,
  readAttribution,
  youtubeLink,
} from './attribution'

describe('parseAttribution', () => {
  it('reads and normalizes utm fields', () => {
    expect(parseAttribution('?utm_source=YouTube&utm_campaign=Why You%27re Stuck&utm_medium=video&x=1', '/guide', 5)).toEqual({
      source: 'youtube',
      medium: 'video',
      campaign: 'why-you-re-stuck',
      landing: '/guide',
      at: 5,
    })
  })
  it('ignores links without a source', () => {
    expect(parseAttribution('?utm_campaign=x')).toBeNull()
    expect(parseAttribution('')).toBeNull()
  })
})

describe('leadReferrer', () => {
  it('appends the campaign to the form page', () => {
    const a = parseAttribution('?utm_source=youtube&utm_campaign=ep-1')
    expect(formatAttribution(a)).toBe('utm_source=youtube&utm_campaign=ep-1')
    expect(leadReferrer('/guide', a)).toBe('/guide?utm_source=youtube&utm_campaign=ep-1')
    expect(leadReferrer('/guide', null)).toBe('/guide')
  })
})

describe('youtubeLink', () => {
  it('builds a tagged moltology.org link', () => {
    const url = new URL(youtubeLink('/guide', 'Why You Are Stuck', 'pinned'))
    expect(url.origin + url.pathname).toBe('https://moltology.org/guide')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'youtube',
      utm_medium: 'video',
      utm_campaign: 'why-you-are-stuck',
      utm_content: 'pinned',
    })
  })
})

describe('isFresh', () => {
  it('expires after the window', () => {
    expect(isFresh({ source: 'youtube', at: 0 }, ATTRIBUTION_TTL_MS - 1)).toBe(true)
    expect(isFresh({ source: 'youtube', at: 0 }, ATTRIBUTION_TTL_MS)).toBe(false)
    expect(isFresh(null, 0)).toBe(false)
  })
})

describe('captureAttribution', () => {
  afterEach(() => {
    window.localStorage.clear()
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })

  it('keeps the first tagged visit', () => {
    window.history.replaceState(null, '', '/guide?utm_source=youtube&utm_campaign=first')
    captureAttribution(1000)
    window.history.replaceState(null, '', '/?utm_source=instagram&utm_campaign=second')
    captureAttribution(2000)
    expect(readAttribution(3000)).toMatchObject({ source: 'youtube', campaign: 'first', landing: '/guide' })
  })

  it('does nothing on an untagged visit and survives bad storage', () => {
    captureAttribution(1000)
    expect(window.localStorage.getItem(ATTRIBUTION_STORAGE_KEY)).toBeNull()
    window.localStorage.setItem(ATTRIBUTION_STORAGE_KEY, '{bad json')
    expect(readAttribution()).toBeNull()
  })
})
