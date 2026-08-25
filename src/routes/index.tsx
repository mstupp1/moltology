import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...seo(HOMEPAGE_SEO)],
    links: [
      canonicalLink(SITE_ORIGIN),
      { rel: 'preload', as: 'image', href: getAssetUrl('/images/hero_widescreen_bg.jpg') },
    ],
  }),
  component: LandingPage,
})
