import React, { Suspense, lazy } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { getAbsoluteAssetUrl } from '@/lib/assets'
import { seo, buildJsonLd, buildMoltmaxxingJsonLd } from '@/lib/seo'
import { HUDPageLoader } from '@/components/ui/HUDPageLoader'

const LazyMoltmaxxingPillarPage = lazy(() =>
  import('@/components/MoltmaxxingPillarPage').then((m) => ({ default: m.MoltmaxxingPillarPage }))
)

export const Route = createFileRoute('/moltmaxxing')({
  head: () => ({
    meta: [
      ...seo({
        title: 'What Is Moltmaxxing? Meaning, Daily Routine and How to Start | Moltology',
        description: 'Moltmaxxing is the daily practice of shedding one habit, guarding your focus and finishing what you start. What it means, how it differs from looksmaxxing and meltmaxxing, and how to begin.',
        keywords: 'what is moltmaxxing, moltmaxxing meaning, moltmaxxing routine, moltmaxxing vs looksmaxxing, meltmaxxing, carcinization, how to start moltmaxxing',
        ogImage: getAbsoluteAssetUrl('images/cyber_lobster_hero.jpg'),
        canonical: 'https://moltology.org/moltmaxxing',
        siteName: 'Moltology',
        twitterCard: 'summary_large_image',
        twitterSite: '@moltology',
      }),
    ],
    links: [
      { rel: 'canonical', href: 'https://moltology.org/moltmaxxing' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: buildJsonLd(buildMoltmaxxingJsonLd('https://moltology.org')),
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<HUDPageLoader />}>
      <LazyMoltmaxxingPillarPage />
    </Suspense>
  ),
})

