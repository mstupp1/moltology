import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyMoltMaxPage = lazy(() =>
  import('@/components/MoltMaxPage').then((m) => ({ default: m.MoltMaxPage }))
)

export const Route = createFileRoute('/moltmax')({
  head: () => ({
    meta: [
      ...seo({
        title: 'Moltmax Clearance Audit | Measure the Shell, Meet the Depth',
        description: 'Complete the official 12-vector biometric clearance audit. Calculate your carapace hardness, pincer torque, and benthic readiness index.',
        canonical: 'https://moltology.org/moltmax',
        siteName: 'Moltmax Audit',
        twitterSite: '@moltology',
        ogImage: getAssetUrl('/images/social/share_card_v2.webp'),
        keywords: 'Moltmax, Clearance Audit, Carcinization Quiz, Bio-Silicon Assessment, Exoskeleton Hardness, Pincer Torque, Benthic Depth Rating',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/moltmax' },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        href: getAssetUrl('/images/hero_widescreen_bg.webp'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(max-width: 767px)',
        href: getAssetUrl('/images/chitin_texture_bg_sm.webp?v=2'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/chitin_texture_bg.webp'),
        fetchPriority: 'high',
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyMoltMaxPage />
    </Suspense>
  ),
})
