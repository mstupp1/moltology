import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  pixelateImage,
  getCachedPixelatedImage,
  clearPixelateCache,
} from './pixelate-avatar'

describe('pixelate-avatar', () => {
  beforeEach(() => {
    clearPixelateCache()
    vi.restoreAllMocks()
  })

  it('returns empty string when src is empty', async () => {
    const res = await pixelateImage('')
    expect(res).toBe('')
  })

  it('returns null from cache when not yet pixelated', () => {
    expect(getCachedPixelatedImage('data:image/svg+xml;base64,test')).toBeNull()
  })

  it('pixelates an image and retrieves it from cache', async () => {
    // Mock HTMLCanvasElement and Image onload behavior
    const mockToDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockPixelated')
    const mockContext = {
      drawImage: vi.fn(),
      imageSmoothingEnabled: true,
    }

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockContext),
          toDataURL: mockToDataURL,
        } as unknown as HTMLCanvasElement
      }
      return document.createElement(tagName)
    })

    const originalImage = global.Image
    // @ts-expect-error test mock
    global.Image = class MockImage {
      width = 100
      height = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 10)
      }
    }

    const testSrc = 'data:image/svg+xml;utf-8,<svg></svg>'
    const pixelated = await pixelateImage(testSrc, { pixelResolution: 64, outputSize: 256 })

    expect(pixelated).toBe('data:image/png;base64,mockPixelated')
    expect(getCachedPixelatedImage(testSrc, { pixelResolution: 64, outputSize: 256 })).toBe(
      'data:image/png;base64,mockPixelated'
    )

    global.Image = originalImage
  })

  it('safely falls back to source URI if image errors', async () => {
    const originalImage = global.Image
    // @ts-expect-error test mock
    global.Image = class MockFailingImage {
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_val: string) {
        setTimeout(() => {
          if (this.onerror) this.onerror()
        }, 10)
      }
    }

    const rawData = 'data:image/svg+xml;charset=utf-8,%3Csvg%3E%3C/svg%3E'
    const result = await pixelateImage(rawData)
    expect(result).toBe(rawData)

    global.Image = originalImage
  })

  it('evicts oldest entries when cache exceeds capacity', async () => {
    const mockToDataURL = vi.fn().mockImplementation(() => `data:image/png;base64,mock_${Math.random()}`)
    const mockContext = {
      drawImage: vi.fn(),
      imageSmoothingEnabled: true,
    }

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: vi.fn().mockReturnValue(mockContext),
          toDataURL: mockToDataURL,
        } as unknown as HTMLCanvasElement
      }
      return document.createElement(tagName)
    })

    const originalImage = global.Image
    // @ts-expect-error test mock
    global.Image = class MockImage {
      width = 100
      height = 100
      onload: (() => void) | null = null
      onerror: (() => void) | null = null
      set src(_val: string) {
        setTimeout(() => {
          if (this.onload) this.onload()
        }, 1)
      }
    }

    // Insert 66 entries (capacity is 64)
    for (let i = 0; i < 66; i++) {
      await pixelateImage(`data:image/svg+xml;base64,item_${i}`)
    }

    // Oldest items (0 and 1) should be evicted
    expect(getCachedPixelatedImage('data:image/svg+xml;base64,item_0')).toBeNull()
    expect(getCachedPixelatedImage('data:image/svg+xml;base64,item_1')).toBeNull()
    // Most recent items should be cached
    expect(getCachedPixelatedImage('data:image/svg+xml;base64,item_65')).not.toBeNull()

    global.Image = originalImage
  })
})
