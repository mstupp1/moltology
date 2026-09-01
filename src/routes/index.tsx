import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...seo(HOMEPAGE_SEO)],
    links: [
      canonicalLink(SITE_ORIGIN),
      // Mobile LCP: chitin hero grain (matches HeroBackground img + fetchPriority high)
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(max-width: 767px)',
        href: getAssetUrl('/images/chitin_texture_bg_sm.webp?v=2'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(max-width: 767px)',
        href: getAssetUrl('/images/hero_card_benthic_core_sm.webp'),
      },
      // Desktop LCP backdrop + deck poster
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/hero_widescreen_bg.webp'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/hero_card_benthic_core.webp'),
      },
    ],
  }),
  component: LandingPage,
})
