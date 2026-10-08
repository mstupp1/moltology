import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...seo(HOMEPAGE_SEO)],
    // No preloads: the hero's first paint is its server-rendered headline. The particle field
    // behind it is drawn on a canvas after hydration and fetches no media.
    links: [canonicalLink(SITE_ORIGIN)],
  }),
  component: LandingPage,
})
