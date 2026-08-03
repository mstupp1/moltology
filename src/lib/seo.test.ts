import { describe, it, expect } from 'vitest'
import { seo } from './seo'

describe('seo.ts - Meta Tag Generator', () => {
  it('returns default og:type meta tag when called with empty options', () => {
    const meta = seo({})
    expect(meta).toEqual([{ name: 'og:type', content: 'website' }])
  })

  it('generates title and og:title tags when title is provided', () => {
    const meta = seo({ title: 'Moltology - Sacred Ecdysis' })
    expect(meta).toContainEqual({ title: 'Moltology - Sacred Ecdysis' })
    expect(meta).toContainEqual({ name: 'og:title', content: 'Moltology - Sacred Ecdysis' })
  })

  it('generates description and og:description tags when description is provided', () => {
    const meta = seo({ description: 'Ascend beyond biological entropy.' })
    expect(meta).toContainEqual({ name: 'description', content: 'Ascend beyond biological entropy.' })
    expect(meta).toContainEqual({ name: 'og:description', content: 'Ascend beyond biological entropy.' })
  })

  it('generates keywords, og:image, and custom og:type meta tags', () => {
    const meta = seo({
      keywords: 'moltology, chitin, ascension',
      ogImage: 'https://example.com/banner.png',
      ogType: 'article',
    })
    expect(meta).toContainEqual({ name: 'keywords', content: 'moltology, chitin, ascension' })
    expect(meta).toContainEqual({ name: 'og:image', content: 'https://example.com/banner.png' })
    expect(meta).toContainEqual({ name: 'og:type', content: 'article' })
  })
})
