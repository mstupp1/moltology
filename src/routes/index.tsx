import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...seo(HOMEPAGE_SEO)],
    links: [
      canonicalLink(SITE_ORIGIN),
      // Mobile LCP: responsive hero artwork (matches the HomeHero backdrop picture)
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(max-width: 767px)',
        href: getAssetUrl('/images/hero_benthic_mobile_v2.webp'),
        fetchPriority: 'high',
      },
      // Desktop LCP backdrop
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/hero_benthic_expansive_v1.webp'),
        fetchPriority: 'high',
      },
    ],
  }),
  component: LandingPage,
})
