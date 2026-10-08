import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
import { HOME_HERO_IMAGE } from '@/components/home/content'

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
        href: HOME_HERO_IMAGE.srcSm,
        fetchPriority: 'high',
      },
      // Desktop LCP backdrop
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: HOME_HERO_IMAGE.src,
        fetchPriority: 'high',
      },
    ],
  }),
  component: LandingPage,
})
