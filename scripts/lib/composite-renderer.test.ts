import { describe, it, expect } from 'vitest'
import { buildCompositeUrl, COMPOSITE_DIMENSIONS } from './composite-renderer'

describe('Composite Renderer Utility', () => {
  it('correctly builds composite capture URL with query parameters', () => {
    const url = buildCompositeUrl({
      baseUrl: 'http://127.0.0.1:3019',
      template: 'spec-showdown',
      theme: 'pincer-torque',
      aspectRatio: '4:5',
      mascot: 'crab_stats',
    })

    expect(url).toContain('http://127.0.0.1:3019/render/composite')
    expect(url).toContain('mode=raw')
    expect(url).toContain('preview=true')
    expect(url).toContain('template=spec-showdown')
    expect(url).toContain('theme=pincer-torque')
    expect(url).toContain('aspect=4%3A5')
    expect(url).toContain('mascot=crab_stats')
  })

  it('correctly serializes custom JSON data payload into query string', () => {
    const customData = {
      headline: 'TEST HEADLINE',
      leftMetric: { label: 'CPU', value: '100%' },
    }

    const url = buildCompositeUrl({
      baseUrl: 'http://localhost:3000',
      template: 'hook',
      data: customData,
    })

    expect(url).toContain('data=')
    const parsed = new URL(url)
    const dataParam = parsed.searchParams.get('data')
    expect(dataParam).toBeDefined()
    expect(JSON.parse(decodeURIComponent(dataParam!))).toEqual(customData)
  })

  it('has valid dimensions configured for all target aspect ratios', () => {
    expect(COMPOSITE_DIMENSIONS['4:5']).toEqual({
      width: 1080,
      height: 1350,
      label: '4:5 Instagram Portrait (1080×1350)',
    })
    expect(COMPOSITE_DIMENSIONS['1:1']).toEqual({
      width: 1080,
      height: 1080,
      label: '1:1 Square Feed (1080×1080)',
    })
    expect(COMPOSITE_DIMENSIONS['9:16']).toEqual({
      width: 1080,
      height: 1920,
      label: '9:16 Reels & Shorts Vertical (1080×1920)',
    })
    expect(COMPOSITE_DIMENSIONS['16:9']).toEqual({
      width: 1600,
      height: 900,
      label: '16:9 Blog Hero & Schematic (1600×900)',
    })
    expect(COMPOSITE_DIMENSIONS['16:10']).toEqual({
      width: 1760,
      height: 1100,
      label: '16:10 Dashboard Desktop HUD (1760×1100)',
    })
  })
})
