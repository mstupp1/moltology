import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'
import '@/components/benefits/benefits.css'
import { INDEXED_BENEFIT_PAGES } from '@/lib/benefits/registry'
import { BENEFITS_HUB_DESCRIPTION, BENEFITS_HUB_TITLE } from '@/lib/benefits/seo'
import { NOINDEX_ROBOTS, SITE_ORIGIN, seo, xRobotsNoindexHeaders } from '@/lib/seo'

const LazyBenefitsHubPage = lazy(() =>
  import('@/components/benefits/BenefitsHubPage').then((m) => ({ default: m.BenefitsHubPage })),
)

const canonical = `${SITE_ORIGIN}/benefits`
/** The hub stays out of search until at least one benefit page is approved for indexing. */
const hubIndexed = INDEXED_BENEFIT_PAGES.length > 0

export const Route = createFileRoute('/benefits/')({
  headers: () => (hubIndexed ? {} : xRobotsNoindexHeaders()),
  head: () => ({
    meta: seo({
      title: BENEFITS_HUB_TITLE,
      description: BENEFITS_HUB_DESCRIPTION,
      canonical,
      robots: hubIndexed ? undefined : NOINDEX_ROBOTS,
      twitterSite: '@moltology',
    }),
    links: [{ rel: 'canonical', href: canonical }],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyBenefitsHubPage />
    </Suspense>
  ),
})
