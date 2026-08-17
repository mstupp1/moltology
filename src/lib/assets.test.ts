import { describe, it, expect } from 'vitest'
import { getAssetUrl, S3_BASE_URL } from './assets'

describe('Asset URL Resolver', () => {
  it('returns empty string for empty input', () => {
    expect(getAssetUrl('')).toBe('')
  })

  it('preserves external HTTP/HTTPS and data URLs', () => {
    expect(getAssetUrl('https://example.com/image.png')).toBe('https://example.com/image.png')
    expect(getAssetUrl('http://example.com/image.png')).toBe('http://example.com/image.png')
    expect(getAssetUrl('data:image/png;base64,123')).toBe('data:image/png;base64,123')
  })

  it('preserves local whitelisted brand assets', () => {
    expect(getAssetUrl('/images/order_emblem.png')).toBe('/images/order_emblem.png')
    expect(getAssetUrl('images/order_emblem.png')).toBe('/images/order_emblem.png')
    expect(getAssetUrl('/favicon.ico')).toBe('/favicon.ico')
    expect(getAssetUrl('/images/bubble_variant_1.jpg')).toBe('/images/bubble_variant_1.jpg')
    expect(getAssetUrl('/images/scanline_pattern.png')).toBe('/images/scanline_pattern.png')
  })

  it('maps heavy content and quiz assets to Neon S3 CDN', () => {
    expect(getAssetUrl('/images/quiz/q01_criticism.jpg')).toBe(
      `${S3_BASE_URL}/images/quiz/q01_criticism.jpg`
    )
    expect(getAssetUrl('images/characters/char_lobster_thumbs_up.png')).toBe(
      `${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.png`
    )
    expect(getAssetUrl('/images/pbr_circuit_matrix.jpg')).toBe(
      `${S3_BASE_URL}/images/pbr_circuit_matrix.jpg`
    )
  })
})
