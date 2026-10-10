import { describe, it, expect } from 'vitest'
import { getAbsoluteAssetUrl, getAssetUrl, S3_BASE_URL, MARKETING_ASSET_VERSION } from './assets'

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
    expect(getAssetUrl('/images/order_emblem.svg')).toBe('/images/order_emblem.svg')
    expect(getAssetUrl('/favicon.svg?v=brand')).toBe('/favicon.svg?v=brand')
    expect(getAssetUrl('/images/order_emblem.png')).toBe('/images/order_emblem.png')
    expect(getAssetUrl('images/order_emblem.png')).toBe('/images/order_emblem.png')
    expect(getAssetUrl('/images/order_emblem.webp')).toBe('/images/order_emblem.webp')
    expect(getAssetUrl('images/order_emblem.webp')).toBe('/images/order_emblem.webp')
    expect(getAssetUrl('/favicon.ico')).toBe('/favicon.ico')
    expect(getAssetUrl('/images/bubble_variant_1.jpg')).toBe('/images/bubble_variant_1.jpg')
    expect(getAssetUrl('/images/scanline_pattern.png')).toBe('/images/scanline_pattern.png')
    expect(getAssetUrl('/images/marketing/dashboard_desktop_preview.webp')).toBe(
      `/images/marketing/dashboard_desktop_preview.webp?v=${MARKETING_ASSET_VERSION}`,
    )
    expect(getAssetUrl('/images/marketing/dashboard_desktop_preview_sm.webp')).toBe(
      `/images/marketing/dashboard_desktop_preview_sm.webp?v=${MARKETING_ASSET_VERSION}`,
    )
    expect(getAssetUrl('/images/marketing/dashboard_mobile_preview.webp')).toBe(
      `/images/marketing/dashboard_mobile_preview.webp?v=${MARKETING_ASSET_VERSION}`,
    )
    expect(getAssetUrl('/images/marketing/dashboard_feature_preview.webp')).toBe(
      `/images/marketing/dashboard_feature_preview.webp?v=${MARKETING_ASSET_VERSION}`,
    )
    expect(getAssetUrl('/images/marketing/forum_feature_preview.webp')).toBe(
      `/images/marketing/forum_feature_preview.webp?v=${MARKETING_ASSET_VERSION}`,
    )
    expect(getAssetUrl('/images/marketing/oracle_feature_preview.webp')).toBe(
      `/images/marketing/oracle_feature_preview.webp?v=${MARKETING_ASSET_VERSION}`,
    )
    expect(getAssetUrl('/images/marketing/dashboard_desktop_preview.webp?custom=1')).toBe(
      '/images/marketing/dashboard_desktop_preview.webp?custom=1',
    )
    expect(getAssetUrl('/images/order_emblem.png?v=2')).toBe(
      '/images/order_emblem.png?v=2',
    )
  })

  it('keeps chassis type art local so Flow stills can drop in later', () => {
    expect(getAssetUrl('/images/chassis/helm.svg')).toBe('/images/chassis/helm.svg')
    expect(getAssetUrl('images/chassis/hammer.webp')).toBe('/images/chassis/hammer.webp')
  })

  it('maps heavy content and quiz assets to the cached /media route', () => {
    expect(getAssetUrl('/images/quiz/q01_criticism.jpg')).toBe('/media/images/quiz/q01_criticism.jpg')
    expect(getAssetUrl('images/characters/char_lobster_thumbs_up.png')).toBe(
      '/media/images/characters/char_lobster_thumbs_up.png'
    )
    expect(getAssetUrl('/images/pbr_circuit_matrix.webp')).toBe('/media/images/pbr_circuit_matrix.webp')
  })

  it('folds absolute bucket URLs into /media and leaves /media paths alone', () => {
    expect(getAssetUrl(`${S3_BASE_URL}/images/blog/a-cover.jpg`)).toBe('/media/images/blog/a-cover.jpg')
    expect(
      getAssetUrl(
        'https://br-bitter-dew-ayea5tmh.storage.c-5.us-east-2.aws.neon.tech/moltology-public-assets/images/x.webp?v=2',
      ),
    ).toBe('/media/images/x.webp?v=2')
    expect(getAssetUrl('/media/images/x.webp')).toBe('/media/images/x.webp')
  })

  it('builds absolute site URLs for off-site consumers', () => {
    expect(getAbsoluteAssetUrl('downloads/guide.pdf')).toBe('https://moltology.org/media/downloads/guide.pdf')
    expect(getAbsoluteAssetUrl('/images/order_emblem.png')).toBe('https://moltology.org/images/order_emblem.png')
    expect(getAbsoluteAssetUrl('https://example.com/a.png')).toBe('https://example.com/a.png')
  })
})
