import { describe, it, expect } from 'vitest'
import { hasWebpTwin, webpTwinKey } from './asset-formats'

describe('asset formats', () => {
  it('gives raster site images a webp twin', () => {
    expect(hasWebpTwin('images/quiz/q01_criticism.jpg')).toBe(true)
    expect(hasWebpTwin('/images/characters/char_lobster_engineer.PNG')).toBe(true)
    expect(hasWebpTwin('images/blog/a-cover.jpeg?v=2')).toBe(true)
  })

  it('leaves social media, non-images, and existing webp alone', () => {
    expect(hasWebpTwin('images/social/posts/post-1.png')).toBe(false)
    expect(hasWebpTwin('downloads/guide.pdf')).toBe(false)
    expect(hasWebpTwin('videos/social/reels/a.mp4')).toBe(false)
    expect(hasWebpTwin('images/pbr_hex_lattice.webp')).toBe(false)
    expect(hasWebpTwin('images/logo.svg')).toBe(false)
  })

  it('swaps the extension and keeps any query string', () => {
    expect(webpTwinKey('images/quiz/q01_criticism.jpg')).toBe('images/quiz/q01_criticism.webp')
    expect(webpTwinKey('images/a.png?v=2')).toBe('images/a.webp?v=2')
    expect(webpTwinKey('images/social/a.png')).toBe('images/social/a.png')
  })
})
