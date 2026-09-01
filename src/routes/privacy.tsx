import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyPrivacyPolicyPage = lazy(() =>
  import('@/components/PrivacyPolicyPage').then((m) => ({ default: m.PrivacyPolicyPage }))
)

export const Route = createFileRoute('/privacy')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Privacy Policy | Moltology Benthic Protocol',
        description: 'Benthic data governance, telemetry privacy, and zero-leakage chitinous encryption standards.',
        canonical: 'https://moltology.org/privacy',
        siteName: 'Moltology',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/privacy' },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyPrivacyPolicyPage />
    </Suspense>
  ),
})

