import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyMoltmaxGuidePage = lazy(() =>
  import('@/components/guide/MoltmaxGuidePage').then((m) => ({ default: m.MoltmaxGuidePage }))
)

export const Route = createFileRoute('/guide')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Free 2026 Moltmaxxing Protocol Field Manual | Moltology',
        description: 'Download the free 4-page Moltmaxxing Protocol Field Manual (Edition 4.0). Build a daily routine, protect your focus, and finish what you start.',
        keywords: 'free moltmaxxing guide, moltmaxxing protocol pdf, algorithmic ecdysis manual, carcinization protocol, pincer torque dynamometry',
        ogImage: getAssetUrl('images/guide/moltmaxxing-hero-v2.webp'),
        canonical: 'https://moltology.org/guide',
        siteName: 'Moltology Codex',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/guide' },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyMoltmaxGuidePage />
    </Suspense>
  ),
})

