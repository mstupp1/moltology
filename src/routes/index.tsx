import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/components/LandingPage'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...seo(HOMEPAGE_SEO)],
    links: [canonicalLink(SITE_ORIGIN)],
  }),
  component: LandingPage,
})
