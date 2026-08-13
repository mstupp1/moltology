import { describe, it, expect } from 'vitest'
import { seo, buildJsonLd, buildArticleJsonLd, generateSitemapXml, generateRssFeedXml } from './seo'

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

  it('builds valid NewsArticle Schema.org structured data', () => {
    const article = {
      slug: 'test-article-slug',
      title: 'Deep Ocean Compute',
      summary: 'A study on subsea datacenters.',
      coverImageUrl: 'https://cdn.moltology.org/cover.jpg',
      authorName: 'High Ascendant Carcinus',
      authorRole: 'Stage 4 Ascendant',
      category: 'SWARM ARCHITECTURE',
      tags: ['Subsea', 'AI'],
      publishedAt: '2026-08-01T00:00:00.000Z',
    }

    const jsonLd = buildArticleJsonLd(article)
    expect(jsonLd['@type']).toBe('NewsArticle')
    expect(jsonLd.headline).toBe('Deep Ocean Compute')
    expect(jsonLd.mainEntityOfPage['@id']).toBe('https://moltology.org/news/test-article-slug')
    expect(jsonLd.author.name).toBe('High Ascendant Carcinus')
  })
})

describe('Sitemap and RSS XML Generators', () => {
  const mockPosts = [
    {
      slug: 'first-dispatch',
      title: 'First Dispatch Title',
      summary: 'First summary text',
      publishedAt: '2026-08-01T12:00:00.000Z',
      category: 'SWARM ARCHITECTURE',
      tags: ['Swarm'],
    },
  ]

  it('generates a valid XML sitemap including static and dynamic routes', () => {
    const xml = generateSitemapXml(mockPosts, 'https://moltology.org')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<loc>https://moltology.org/news</loc>')
    expect(xml).toContain('<loc>https://moltology.org/news/first-dispatch</loc>')
  })

  it('generates a valid RSS 2.0 feed with items and escaping', () => {
    const xml = generateRssFeedXml(mockPosts, 'https://moltology.org')
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" ?>')
    expect(xml).toContain('<rss version="2.0"')
    expect(xml).toContain('<title>MoltNation News | Patriot Telemetry &amp; Benthic AI</title>')
    expect(xml).toContain('<title>First Dispatch Title</title>')
    expect(xml).toContain('<link>https://moltology.org/news/first-dispatch</link>')
  })
})
