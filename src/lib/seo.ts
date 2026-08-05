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
  siteName?: string
  author?: string
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
  siteName = 'Moltology',
  author,
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

  if (twitterCard) {
    metas.push({ name: 'twitter:card', content: twitterCard })
  }

  if (twitterSite) {
    metas.push({ name: 'twitter:site', content: twitterSite })
  }

  return metas
}

export function buildJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
}
