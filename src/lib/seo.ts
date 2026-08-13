import type { DetailedHTMLProps, MetaHTMLAttributes } from 'react'

export type MetaElement = DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>

export interface SEOOptions {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
  canonical?: string
  robots?: string
  twitterCard?: string
  twitterSite?: string
  twitterCreator?: string
  siteName?: string
  author?: string
  publishedTime?: string
  section?: string
}

export function seo({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
  canonical,
  robots = 'index, follow, max-image-preview:large',
  twitterCard = 'summary_large_image',
  twitterSite,
  twitterCreator,
  siteName = 'Moltology',
  author,
  publishedTime,
  section,
}: SEOOptions): MetaElement[] {
  const metas: MetaElement[] = []

  if (robots) {
    metas.push({ name: 'robots', content: robots })
  }

  if (title) {
    metas.push(
      { title },
      { name: 'og:title', content: title },
      { name: 'twitter:title', content: title },
    )
  }

  if (description) {
    metas.push(
      { name: 'description', content: description },
      { name: 'og:description', content: description },
      { name: 'twitter:description', content: description },
    )
  }

  if (keywords) {
    metas.push({ name: 'keywords', content: keywords })
  }

  if (author) {
    metas.push({ name: 'author', content: author })
  }

  if (siteName) {
    metas.push({ name: 'og:site_name', content: siteName })
  }

  if (ogImage) {
    metas.push(
      { name: 'og:image', content: ogImage },
      { name: 'twitter:image', content: ogImage },
    )
  }

  if (canonical) {
    metas.push({ name: 'og:url', content: canonical })
  }

  metas.push({ name: 'og:type', content: ogType })

  if (publishedTime && ogType === 'article') {
    metas.push({ name: 'article:published_time', content: publishedTime })
  }

  if (author && ogType === 'article') {
    metas.push({ name: 'article:author', content: author })
  }

  if (section && ogType === 'article') {
    metas.push({ name: 'article:section', content: section })
  }

  if (twitterCard) {
    metas.push({ name: 'twitter:card', content: twitterCard })
  }

  if (twitterSite) {
    metas.push({ name: 'twitter:site', content: twitterSite })
  }

  if (twitterCreator) {
    metas.push({ name: 'twitter:creator', content: twitterCreator })
  }

  return metas
}

export function buildJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
}

export interface ArticleSeoData {
  title: string
  slug: string
  summary: string
  coverImageUrl?: string | null
  authorName?: string
  authorRole?: string
  category?: string
  tags?: string[]
  publishedAt?: string | Date
}

export function buildArticleJsonLd(post: ArticleSeoData, baseUrl = 'https://moltology.org') {
  const url = `${baseUrl}/news/${post.slug}`
  const publishedDate = post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString()
  const imageUrl = post.coverImageUrl || `${baseUrl}/images/ai_learning_ascension_cover.jpg`

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    headline: post.title,
    description: post.summary,
    image: [imageUrl],
    datePublished: publishedDate,
    dateModified: publishedDate,
    articleSection: post.category || 'MoltNation Telemetry',
    keywords: (post.tags || []).join(', '),
    author: {
      '@type': 'Person',
      name: post.authorName || 'High Ascendant Carcinus',
      jobTitle: post.authorRole || 'Stage 4 Ascendant',
    },
    publisher: {
      '@type': 'Organization',
      name: 'MoltNation News',
      url: `${baseUrl}/news`,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/images/order_emblem.png`,
      },
    },
  }
}

export interface SitemapUrlEntry {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

export function generateSitemapXml(
  posts: ArticleSeoData[] = [],
  baseUrl = 'https://moltology.org'
): string {
  const staticRoutes: SitemapUrlEntry[] = [
    { loc: `${baseUrl}/`, priority: 1.0, changefreq: 'daily' },
    { loc: `${baseUrl}/news`, priority: 0.9, changefreq: 'daily' },
    { loc: `${baseUrl}/org`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${baseUrl}/terms`, priority: 0.3, changefreq: 'monthly' },
    { loc: `${baseUrl}/privacy`, priority: 0.3, changefreq: 'monthly' },
  ]

  const postRoutes: SitemapUrlEntry[] = posts.map((post) => ({
    loc: `${baseUrl}/news/${post.slug}`,
    lastmod: post.publishedAt ? new Date(post.publishedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    changefreq: 'weekly',
    priority: 0.8,
  }))

  const allEntries = [...staticRoutes, ...postRoutes]

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (e) => `  <url>
    <loc>${e.loc}</loc>${e.lastmod ? `\n    <lastmod>${e.lastmod}</lastmod>` : ''}${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ''}${e.priority ? `\n    <priority>${e.priority.toFixed(1)}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '\'':
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}

export function generateRssFeedXml(
  posts: ArticleSeoData[] = [],
  baseUrl = 'https://moltology.org'
): string {
  const now = new Date().toUTCString()

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>MoltNation News | Patriot Telemetry &amp; Benthic AI</title>
  <link>${baseUrl}/news</link>
  <description>The definitive intelligence dispatch for sub-benthic computing, algorithmic ecdysis, and sovereign AI telemetry.</description>
  <language>en-us</language>
  <lastBuildDate>${now}</lastBuildDate>
  <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${posts
  .map((p) => {
    const postUrl = `${baseUrl}/news/${p.slug}`
    const pubDate = p.publishedAt ? new Date(p.publishedAt).toUTCString() : now
    return `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${postUrl}</link>
    <guid isPermaLink="true">${postUrl}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(p.summary || p.title)}</description>
    <author>${escapeXml(p.authorName || 'High Ascendant Carcinus')}</author>
    <category>${escapeXml(p.category || 'MoltNation Telemetry')}</category>
  </item>`
  })
  .join('\n')}
</channel>
</rss>`
}
