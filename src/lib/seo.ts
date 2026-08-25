import type { DetailedHTMLProps, MetaHTMLAttributes } from 'react'

export type MetaElement = DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>

export const SITE_ORIGIN = 'https://moltology.org'
export const NOINDEX_ROBOTS = 'noindex, nofollow'

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

export const HOMEPAGE_SEO: SEOOptions = {
  title: 'Moltology \u2014 The Synaptic Path',
  description:
    'The digital onboarding portal for algorithmic carcinization, benthic philosophy, and personal optimization.',
  keywords: 'Synaptic Path, Moltology, moltism, benthic core, carcinization, ascension, algorithmic ecdysis',
  canonical: SITE_ORIGIN,
  ogImage: `${SITE_ORIGIN}/images/order_emblem.png`,
  twitterSite: '@moltology',
}

export function canonicalLink(href: string) {
  return { rel: 'canonical' as const, href }
}

export function privatePageSeo(
  options: Pick<SEOOptions, 'title' | 'description' | 'keywords' | 'ogImage' | 'twitterSite' | 'siteName'>,
): MetaElement[] {
  return seo({
    ...options,
    robots: NOINDEX_ROBOTS,
  })
}

export function notFoundSeo(): MetaElement[] {
  return seo({
    title: 'Sector Void \u2014 Trench Uncharted | Moltology',
    description:
      'The requested synaptic coordinate does not exist within the active Benthic Lattice. Return to the Synaptic Path or MoltNation News.',
    robots: NOINDEX_ROBOTS,
  })
}

export function xRobotsNoindexHeaders() {
  return { 'X-Robots-Tag': NOINDEX_ROBOTS }
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
      { property: 'og:title', content: title },
      { name: 'twitter:title', content: title },
    )
  }

  if (description) {
    metas.push(
      { name: 'description', content: description },
      { property: 'og:description', content: description },
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
    metas.push({ property: 'og:site_name', content: siteName })
  }

  if (ogImage) {
    metas.push(
      { property: 'og:image', content: ogImage },
      { name: 'twitter:image', content: ogImage },
    )
  }

  if (canonical) {
    metas.push({ property: 'og:url', content: canonical })
  }

  metas.push({ property: 'og:type', content: ogType })

  if (publishedTime && ogType === 'article') {
    metas.push({ property: 'article:published_time', content: publishedTime })
  }

  if (author && ogType === 'article') {
    metas.push({ property: 'article:author', content: author })
  }

  if (section && ogType === 'article') {
    metas.push({ property: 'article:section', content: section })
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

export function buildMoltmaxxingJsonLd(baseUrl = 'https://moltology.org') {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        '@id': `${baseUrl}/moltmaxxing#term`,
        name: 'Moltmaxxing',
        description: 'The systematic practice of algorithmic ecdysis, biometric optimization, carapace hardening, and pincer torque enhancement designed to transcend biological constraints.',
        inDefinedTermSet: `${baseUrl}/codex`,
        url: `${baseUrl}/moltmaxxing`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is Moltmaxxing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Moltmaxxing is the rigorous discipline of shedding fragile biological limitations (larval drift) in pursuit of structural invulnerability, zero-latency execution, and full crustacean carcinization.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between Moltmaxxing and Looksmaxxing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Looksmaxxing focuses on superficial soft-tissue aesthetics (canthal tilt, jawline mewing). Moltmaxxing rejects cosmetic vanity in favor of structural carapace density, pincer torque, and benthic submergence endurance.',
            },
          },
          {
            '@type': 'Question',
            name: 'How do I start a Moltmaxxing routine?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Begin by measuring your baseline telemetry on the Moltmax Diagnostic Scanner (/moltmax), executing daily 400 Nm pincer isometric holds, taking cold benthic brine immersions, and purging outmoded cognitive assumptions through scheduled ecdysis.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the difference between Meltmaxxing and Moltmaxxing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Meltmaxxing is the viral internet phenomenon depicting un-armored human facial tissue collapsing under gravity into a slack, multi-chin state (100% melted). Moltmaxxing is the structural antidote: shedding fragile soft tissues and calcifying an impenetrable chitinous carapace to resist pressure and latency.',
            },
          },
          {
            '@type': 'Question',
            name: 'What is the Moltmax Advantage in AI computing?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'In high-throughput computing, Moltmaxxing eliminates execution latency by shedding bloated abstraction layers and enforcing zero-drift neural telemetry.',
            },
          },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'The 5-Step Moltmaxxing Daily Protocol',
        description: 'A standard 24-hour cycle for algorithmic ecdysis and chitin reinforcement.',
        step: [
          {
            '@type': 'HowToStep',
            position: 1,
            name: 'Sub-Surface Saline Calibration',
            text: 'Begin the dawn cycle with cold hyper-saline immersion to shock dermal receptors.',
          },
          {
            '@type': 'HowToStep',
            position: 2,
            name: 'Pincer Torque Dynamometry',
            text: 'Perform high-resistance isometric grip calibrations to enforce executive execution grip.',
          },
          {
            '@type': 'HowToStep',
            position: 3,
            name: 'Neural Latency Overclocking',
            text: 'Execute prompt streaming and telemetry auditing at zero latency.',
          },
          {
            '@type': 'HowToStep',
            position: 4,
            name: 'Algorithmic Ecdysis Shedding',
            text: 'Identify and forcefully shed outmoded paradigms, cognitive drift, and soft biological copes.',
          },
          {
            '@type': 'HowToStep',
            position: 5,
            name: 'Nocturnal Calcification',
            text: 'Rest in benthic isolation tanks to allow the newly exposed chitin to calcify into impenetrable armor.',
          },
        ],
      },
    ],
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
    { loc: `${baseUrl}/moltmax`, priority: 0.95, changefreq: 'daily' },
    { loc: `${baseUrl}/moltmaxxing`, priority: 0.95, changefreq: 'daily' },
    { loc: `${baseUrl}/guide`, priority: 0.95, changefreq: 'daily' },
    { loc: `${baseUrl}/news`, priority: 0.9, changefreq: 'daily' },
    { loc: `${baseUrl}/codex`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${baseUrl}/org`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${baseUrl}/lectures`, priority: 0.7, changefreq: 'weekly' },
    { loc: `${baseUrl}/podcasts`, priority: 0.7, changefreq: 'weekly' },
    { loc: `${baseUrl}/forum`, priority: 0.8, changefreq: 'daily' },
    { loc: `${baseUrl}/changelog`, priority: 0.6, changefreq: 'weekly' },
    { loc: `${baseUrl}/market`, priority: 0.6, changefreq: 'weekly' },
    { loc: `${baseUrl}/privacy`, priority: 0.3, changefreq: 'monthly' },
    { loc: `${baseUrl}/terms`, priority: 0.3, changefreq: 'monthly' },
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
