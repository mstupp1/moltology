import { describe, it, expect } from 'vitest'
import { seo, buildJsonLd } from './seo'

describe('SEO Meta Tag Generator', () => {
  it('generates standard metadata including default robots and ogType', () => {
    const meta = seo({
      title: 'Moltology Home',
      description: 'The Synaptic Path onboarding portal.',
    })

    expect(meta).toEqual(
      expect.arrayContaining([
        { name: 'robots', content: 'index, follow, max-image-preview:large' },
        { title: 'Moltology Home' },
        { name: 'og:title', content: 'Moltology Home' },
        { name: 'twitter:title', content: 'Moltology Home' },
        { name: 'description', content: 'The Synaptic Path onboarding portal.' },
        { name: 'og:description', content: 'The Synaptic Path onboarding portal.' },
        { name: 'twitter:description', content: 'The Synaptic Path onboarding portal.' },
        { name: 'og:site_name', content: 'Moltology' },
        { name: 'og:type', content: 'website' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ])
    )
  })

  it('includes canonical URL and og:url when provided', () => {
    const meta = seo({
      title: 'Codex Page',
      canonical: 'https://moltology.org/codex',
    })

    expect(meta).toEqual(
      expect.arrayContaining([
        { name: 'og:url', content: 'https://moltology.org/codex' },
      ])
    )
  })

  it('includes openGraph image and twitter image when ogImage is supplied', () => {
    const meta = seo({
      title: 'Gallery',
      ogImage: 'https://moltology.org/images/order_emblem.png',
    })

    expect(meta).toEqual(
      expect.arrayContaining([
        { name: 'og:image', content: 'https://moltology.org/images/order_emblem.png' },
        { name: 'twitter:image', content: 'https://moltology.org/images/order_emblem.png' },
      ])
    )
  })

  it('includes custom author and keywords when provided', () => {
    const meta = seo({
      title: 'Article',
      author: 'Order of the Synaptic Path',
      keywords: 'carcinization, ecdysis, benthic',
    })

    expect(meta).toEqual(
      expect.arrayContaining([
        { name: 'author', content: 'Order of the Synaptic Path' },
        { name: 'keywords', content: 'carcinization, ecdysis, benthic' },
      ])
    )
  })
})

describe('JSON-LD Builder Helper', () => {
  it('stringifies valid Schema.org object structures into JSON', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Moltology',
      url: 'https://moltology.org',
    }

    const result = buildJsonLd(schema)
    expect(result).toBe('{"@context":"https://schema.org","@type":"Organization","name":"Moltology","url":"https://moltology.org"}')
  })
})
