import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyTermsOfServicePage = lazy(() =>
  import('@/components/TermsOfServicePage').then((m) => ({ default: m.TermsOfServicePage }))
)

export const Route = createFileRoute('/terms')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Terms of Engagement | Moltology Service Directives',
        description: 'Terms of engagement, covenant agreements, and protocols governing initiate access to the Moltology platform.',
        canonical: 'https://moltology.org/terms',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/terms' },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyTermsOfServicePage />
    </Suspense>
  ),
})

