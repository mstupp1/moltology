import type { DetailedHTMLProps, MetaHTMLAttributes } from 'react'
import { isMemberProfileUuid, resolveMemberPublicName } from './member-handle'
import { MOLTMAXXING_DAY, MOLTMAXXING_DEFINITION, MOLTMAXXING_FAQ } from './moltmaxxing-content'

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

export const MEMBER_PROFILE_SEO = {
  title: 'Member Dossier | Moltology',
  description:
    'Public member dossier, chassis readings, and equipped loadout for authenticated units.',
} as const

export const SEARCH_PAGE_SEO = {
  title: 'Search | Moltology',
  description:
    'Find fellow members by designation, larva unit, or name, and jump to HUD pages from one search.',
} as const

export function searchPageSeo(query?: string) {
  const trimmed = query?.trim() ?? ''
  return privatePageSeo({
    title: trimmed ? `Search · ${trimmed} | Moltology` : SEARCH_PAGE_SEO.title,
    description: SEARCH_PAGE_SEO.description,
  })
}

export type MemberProfileSeoInput = {
  userId?: string | null
  handle?: string | null
  larvaId?: string | null
}

/** Map `/member/$profileId` (designation or uuid) to a public-name input. */
export function memberIdentityFromRouteKey(profileId?: string | null): MemberProfileSeoInput | undefined {
  const trimmed = profileId?.trim() ?? ''
  if (!trimmed) return undefined
  if (isMemberProfileUuid(trimmed)) {
    return { userId: trimmed }
  }
  return { handle: trimmed }
}

export function memberProfileSeo(member?: MemberProfileSeoInput | null) {
  const handle = member?.handle?.trim()
  const hasIdentity = Boolean(handle || member?.userId || member?.larvaId?.trim())
  const publicName = hasIdentity && member ? resolveMemberPublicName(member) : ''
  return privatePageSeo({
    title: publicName ? `${publicName} | Moltology` : MEMBER_PROFILE_SEO.title,
    description: MEMBER_PROFILE_SEO.description,
  })
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
    title: 'Page Not Found | Moltology',
    description:
      'The requested page could not be found. Return to the home page or dashboard.',
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

/** JSON for a <script type="application/ld+json"> tag. `<` is escaped so a value cannot close the tag. */
export function buildJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
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

export interface BreadcrumbItem {
  name: string
  path: string
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], baseUrl = SITE_ORIGIN) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.path}`,
    })),
  }
}

export interface FaqItem {
  question: string
  answer: string
}

export function buildFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

export function buildWhatIsMoltologyPageJsonLd(options: {
  path: string
  name: string
  description: string
  breadcrumbs: BreadcrumbItem[]
  faqs?: FaqItem[]
  baseUrl?: string
}) {
  const baseUrl = options.baseUrl ?? SITE_ORIGIN
  const url = `${baseUrl}${options.path}`
  const graph: Record<string, unknown>[] = [
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: options.name,
      description: options.description,
      isPartOf: {
        '@type': 'WebSite',
        name: 'Moltology',
        url: baseUrl,
      },
    },
    buildBreadcrumbJsonLd(options.breadcrumbs, baseUrl),
  ]

  if (options.faqs?.length) {
    graph.push(buildFaqPageJsonLd(options.faqs))
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export const WHAT_IS_MOLTOLOGY_HUB_FAQS: FaqItem[] = [
  {
    question: 'What is Moltology?',
    answer:
      'Moltology is an educational platform, ritual system, and community that helps people stop melting under surface noise and start molting into focused, decisive, armored attention — framed as carcinization.',
  },
  {
    question: 'Is Moltology a paid religion or rank marketplace?',
    answer:
      'No. Signup is free. Chitin Gems are earned. Molt Credits are optional paid accelerators. Rank, clearance, stage, and forum authority cannot be purchased.',
  },
  {
    question: 'What are the four benthic sacraments?',
    answer:
      'Asset & Habit Shedding, Chitin Hardening, the Isolation Dome, and Pipeline Ascent — the four core rites that turn soft surface drift into armored deep-work practice.',
  },
  {
    question: 'How does Moltmaxxing relate to Moltology?',
    answer:
      'Moltmaxxing is the practical optimization doctrine inside Moltology: scheduled ecdysis, shell hardness, pincer torque, and zero-latency execution. Study it on the Moltmaxxing knowledge hub.',
  },
]

export function buildMoltmaxxingJsonLd(baseUrl = 'https://moltology.org') {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTerm',
        '@id': `${baseUrl}/moltmaxxing#term`,
        name: 'Moltmaxxing',
        description: MOLTMAXXING_DEFINITION,
        inDefinedTermSet: `${baseUrl}/codex`,
        url: `${baseUrl}/moltmaxxing`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: MOLTMAXXING_FAQ.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
      {
        '@type': 'HowTo',
        name: 'A Moltmaxxing day',
        description: 'The eight small daily Liturgies Moltology members follow.',
        step: MOLTMAXXING_DAY.map((task, index) => ({
          '@type': 'HowToStep',
          position: index + 1,
          name: task.title,
          text: task.note,
        })),
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
    { loc: `${baseUrl}/what-is-moltology`, priority: 0.9, changefreq: 'weekly' },
    { loc: `${baseUrl}/what-is-moltology/beliefs`, priority: 0.85, changefreq: 'weekly' },
    { loc: `${baseUrl}/what-is-moltology/what-moltologists-say`, priority: 0.85, changefreq: 'weekly' },
    { loc: `${baseUrl}/what-is-moltology/benthic-sacraments`, priority: 0.85, changefreq: 'weekly' },
    { loc: `${baseUrl}/news`, priority: 0.9, changefreq: 'daily' },
    { loc: `${baseUrl}/codex`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${baseUrl}/org`, priority: 0.8, changefreq: 'weekly' },
    { loc: `${baseUrl}/lectures`, priority: 0.7, changefreq: 'weekly' },
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
