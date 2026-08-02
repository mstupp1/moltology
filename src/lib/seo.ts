import type { DetailedHTMLProps, MetaHTMLAttributes } from 'react'

type MetaElement = DetailedHTMLProps<MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>

interface SEOOptions {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogType?: string
}

export function seo({
  title,
  description,
  keywords,
  ogImage,
  ogType = 'website',
}: SEOOptions): MetaElement[] {
  const metas: MetaElement[] = []

  if (title) {
    metas.push({ title }, { name: 'og:title', content: title })
  }
  if (description) {
    metas.push(
      { name: 'description', content: description },
      { name: 'og:description', content: description },
    )
  }
  if (keywords) {
    metas.push({ name: 'keywords', content: keywords })
  }
  if (ogImage) {
    metas.push({ name: 'og:image', content: ogImage })
  }
  metas.push({ name: 'og:type', content: ogType })

  return metas
}
