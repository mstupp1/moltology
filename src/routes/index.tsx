import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { HOMEPAGE_SEO, SITE_ORIGIN, canonicalLink, seo } from '@/lib/seo'
import { getAssetUrl } from '@/lib/assets'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyLandingPage = lazy(() =>
  import('@/components/LandingPage').then((m) => ({ default: m.LandingPage }))
)

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [...seo(HOMEPAGE_SEO)],
    links: [
      canonicalLink(SITE_ORIGIN),
      // Mobile LCP: first hero deck poster
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(max-width: 767px)',
        href: getAssetUrl('/images/hero_card_benthic_core_sm.webp'),
        fetchPriority: 'high',
      },
      // Desktop LCP backdrop + deck poster
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/hero_widescreen_bg.webp'),
        fetchPriority: 'high',
      },
      {
        rel: 'preload',
        as: 'image',
        type: 'image/webp',
        media: '(min-width: 768px)',
        href: getAssetUrl('/images/hero_card_benthic_core.webp'),
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyLandingPage />
    </Suspense>
  ),
})
