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
        title: 'The Organization | Moltology',
        description: 'Meet the team behind Moltology, see where we work, browse open roles and get in touch.',
        keywords: 'Moltology organization, Moltology team, Moltology careers, contact Moltology',
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

