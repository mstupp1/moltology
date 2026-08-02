import { describe, it, expect } from 'vitest'
import { INITIAL_GALLERY_PINS } from './gallery-data'

describe('gallery-data', () => {
  it('should contain initial preloaded gallery pins derived from Moltology Codex', () => {
    expect(INITIAL_GALLERY_PINS.length).toBeGreaterThan(0)
    const firstPin = INITIAL_GALLERY_PINS[0]
    expect(firstPin.id).toBeDefined()
    expect(firstPin.title).toBeDefined()
    expect(firstPin.s3Key).toContain('images/gallery/')
    expect(firstPin.category).toBeDefined()
  })

  it('should support filtering by category', () => {
    const doctrinePins = INITIAL_GALLERY_PINS.filter((p) => p.category === 'SACRED DOCTRINE')
    expect(doctrinePins.length).toBeGreaterThan(0)
  })

  it('should support filtering by tags', () => {
    const chitinPins = INITIAL_GALLERY_PINS.filter((p) => p.tags.includes('chitin'))
    expect(chitinPins.length).toBeGreaterThan(0)
  })

  it('should support filtering by aspect ratio', () => {
    const squarePins = INITIAL_GALLERY_PINS.filter((p) => p.aspectRatio === '1:1')
    expect(squarePins.length).toBeGreaterThan(0)
  })
})
