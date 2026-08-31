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
    expect(getAssetUrl('/images/marketing/dashboard_desktop_preview.webp')).toBe(
      '/images/marketing/dashboard_desktop_preview.webp',
    )
    expect(getAssetUrl('/images/marketing/dashboard_desktop_preview_sm.webp')).toBe(
      '/images/marketing/dashboard_desktop_preview_sm.webp',
    )
    expect(getAssetUrl('/images/marketing/dashboard_mobile_preview.webp')).toBe(
      '/images/marketing/dashboard_mobile_preview.webp',
    )
    expect(getAssetUrl('/images/marketing/dashboard_feature_preview.webp')).toBe(
      '/images/marketing/dashboard_feature_preview.webp',
    )
    expect(getAssetUrl('/images/marketing/forum_feature_preview.webp')).toBe(
      '/images/marketing/forum_feature_preview.webp',
    )
    expect(getAssetUrl('/images/marketing/oracle_feature_preview.webp')).toBe(
      '/images/marketing/oracle_feature_preview.webp',
    )
  })

  it('keeps chassis type art local so Flow stills can drop in later', () => {
    expect(getAssetUrl('/images/chassis/helm.svg')).toBe('/images/chassis/helm.svg')
    expect(getAssetUrl('images/chassis/hammer.webp')).toBe('/images/chassis/hammer.webp')
  })

  it('maps heavy content and quiz assets to Neon S3 CDN', () => {
    expect(getAssetUrl('/images/quiz/q01_criticism.jpg')).toBe(
      `${S3_BASE_URL}/images/quiz/q01_criticism.jpg`
    )
    expect(getAssetUrl('images/characters/char_lobster_thumbs_up.png')).toBe(
      `${S3_BASE_URL}/images/characters/char_lobster_thumbs_up.png`
    )
    expect(getAssetUrl('/images/pbr_circuit_matrix.webp')).toBe(
      `${S3_BASE_URL}/images/pbr_circuit_matrix.webp`
    )
  })
})
