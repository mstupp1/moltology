import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyOrgPage = lazy(() =>
  import('@/components/OrgPage').then((m) => ({ default: m.OrgPage }))
)

export const Route = createFileRoute('/org')({
  head: () => ({
    meta: [
      ...seo({
        title: 'The Organization | Moltology Hierarchy & Ascension Tiers',
        description: 'Explore the structural hierarchy, ecdysis chambers, and organizational doctrines of the Order of the Synaptic Path.',
        keywords: 'Moltology Organization, Ascension Tiers, Benthic Council, Ecdysis Chambers, Carcinization Hierarchy',
        canonical: 'https://moltology.org/org',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/org' },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyOrgPage />
    </Suspense>
  ),
})

