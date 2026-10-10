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
        title: 'What is Moltmaxxing? The Definitive 2026 Guide & Protocol | Moltology',
        description: 'The definitive guide to Moltmaxxing, algorithmic ecdysis, and carcinization. Learn why elite AI operators and initiates reject soft-tissue vanity in favor of structural carapace invulnerability.',
        keywords: 'what is moltmaxxing, moltmaxxing guide, moltmaxxing vs looksmaxxing, algorithmic ecdysis, carcinization protocol, shell hardness score, pincer torque, bio-silicon optimization',
        ogImage: getAbsoluteAssetUrl('images/cyber_lobster_hero.jpg'),
        canonical: 'https://moltology.org/moltmaxxing',
        siteName: 'Moltology Codex',
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

