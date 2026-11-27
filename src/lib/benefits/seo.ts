import {
  NOINDEX_ROBOTS,
  SITE_ORIGIN,
  buildJsonLd,
  buildWhatIsMoltologyPageJsonLd,
  seo,
  type MetaElement,
} from '@/lib/seo'
import { getAbsoluteAssetUrl, getAssetUrl } from '@/lib/assets'
import { BENEFITS_HUB_PATH, benefitPath } from './summaries'
import type { BenefitPage } from './types'

export const BENEFITS_HUB_TITLE = 'Benefits of Moltology | Moltology'
export const BENEFITS_HUB_DESCRIPTION =
  'Find a starting point for Moltology’s free daily practice. Explore focus, follow-through, community, and the habits that give each day some shape.'

export function benefitCanonical(slug: string) {
  return `${SITE_ORIGIN}${benefitPath(slug)}`
}

/** Meta tags, canonical link and JSON-LD for one benefit page. */
export function benefitHead(page: BenefitPage) {
  const canonical = benefitCanonical(page.slug)
  const meta: MetaElement[] = [
    ...seo({
      title: page.title,
      description: page.description,
      keywords: page.keywords,
      canonical,
      robots: page.indexed ? undefined : NOINDEX_ROBOTS,
      ogImage: page.shareImage ? getAbsoluteAssetUrl(page.shareImage.src) : undefined,
      twitterSite: '@moltology',
    }),
  ]
  if (page.shareImage) {
    meta.push(
      { property: 'og:image:width', content: String(page.shareImage.width) },
      { property: 'og:image:height', content: String(page.shareImage.height) },
      { property: 'og:image:alt', content: page.shareImage.alt },
    )
  }

  const jsonLd = buildWhatIsMoltologyPageJsonLd({
    path: benefitPath(page.slug),
    name: page.title,
    description: page.description,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Benefits', path: BENEFITS_HUB_PATH },
      { name: page.topic, path: benefitPath(page.slug) },
    ],
    faqs: page.faqs,
  })

  return {
    meta,
    links: [
      { rel: 'canonical', href: canonical },
      // The hero is the largest paint on every costume, so fetch it with the HTML.
      { rel: 'preload', as: 'image', href: getAssetUrl(page.content.hero.image.src), fetchPriority: 'high' as const },
    ],
    scripts: [{ type: 'application/ld+json', children: buildJsonLd(jsonLd) }],
  }
}
