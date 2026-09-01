import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyLandingPage = lazy(() =>
  import('@/components/LandingPage').then((m) => ({ default: m.LandingPage }))
)

export const Route = createFileRoute('/landing')({
  head: () => ({
    meta: [...seo({ ...HOMEPAGE_SEO, canonical: SITE_ORIGIN })],
    links: [canonicalLink(SITE_ORIGIN)],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyLandingPage />
    </Suspense>
  ),
})

