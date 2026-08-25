import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'

export const Route = createFileRoute('/landing')({
  head: () => ({
    meta: [...seo({ ...HOMEPAGE_SEO, canonical: SITE_ORIGIN })],
    links: [canonicalLink(SITE_ORIGIN)],
  }),
  component: LandingPage,
})
